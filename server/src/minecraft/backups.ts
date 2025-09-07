import archiver from 'archiver'
import fse from 'fs-extra'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import zlib from 'node:zlib'

import { CONFIG } from '../lib/config.js'
import { processManager } from './process.js'

export type BackupInfo = { id: string; path: string; size: number; createdAt: number }

const ensureDirs = async () => {
  await fsp.mkdir(CONFIG.BACKUP_DIR, { recursive: true })
  await fsp.mkdir(path.join(CONFIG.BACKUP_DIR, 'snapshots'), { recursive: true })
}

export const listBackups = async (): Promise<BackupInfo[]> => {
  try {
    await ensureDirs()
    const files = await fsp.readdir(CONFIG.BACKUP_DIR)
    const items: BackupInfo[] = []
    
    for (const name of files) {
      if (!name.endsWith('.tar.gz')) continue
      
      const full = path.join(CONFIG.BACKUP_DIR, name)
      try {
        const stat = await fsp.stat(full)
        items.push({ id: name, path: full, size: stat.size, createdAt: stat.mtimeMs })
      } catch (error) {
        // Ignora file che non possono essere letti (potrebbero essere stati cancellati nel frattempo)
        console.warn(`Failed to stat backup file ${name}:`, error instanceof Error ? error.message : error)
      }
    }
    
    items.sort((a, b) => b.createdAt - a.createdAt)
    return items
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to list backups: ${errorMsg}`)
  }
}

const tarGzDir = async (srcDir: string, outFile: string, baseDir: string) => {
  await fsp.mkdir(path.dirname(outFile), { recursive: true })
  
  const output = fs.createWriteStream(outFile)
  const archive = archiver('tar', {
    gzip: true,
    gzipOptions: { level: zlib.constants.Z_BEST_COMPRESSION },
  })
  
  const done = new Promise<void>((resolve, reject) => {
    let completed = false
    
    const cleanup = () => {
      if (!completed) {
        completed = true
        try {
          output.destroy()
        } catch {
          // Ignora errori di cleanup
        }
      }
    }
    
    output.on('close', () => {
      if (!completed) {
        completed = true
        resolve()
      }
    })
    
    output.on('error', (err) => {
      cleanup()
      reject(new Error(`Output stream error: ${err.message}`))
    })
    
    archive.on('error', (err) => {
      cleanup()
      reject(new Error(`Archive error: ${err.message}`))
    })
    
    archive.on('warning', (err) => {
      // Log warnings but don't fail the operation
      console.warn('Archive warning:', err.message)
    })
  })
  
  try {
    archive.pipe(output)
    archive.directory(srcDir, false, (entry) => {
      // esclude la cartella dei backup
      const rel = path.relative(baseDir, entry.name)
      if (rel.startsWith(path.relative(baseDir, CONFIG.BACKUP_DIR))) return false
      return entry
    })
    await archive.finalize()
    await done
  } catch (error) {
    // Cleanup in caso di errore
    try {
      output.destroy()
      await fsp.rm(outFile, { force: true })
    } catch {
      // Ignora errori di cleanup
    }
    throw error
  }
}

export const createBackup = async (mode: 'full' | 'world'): Promise<BackupInfo> => {
  await ensureDirs()
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const name = `backup-${mode}-${ts}.tar.gz`
  const out = path.join(CONFIG.BACKUP_DIR, name)
  const src = mode === 'world' ? path.join(CONFIG.MC_DIR, 'world') : CONFIG.MC_DIR

  try {
    // Verifica che la directory sorgente esista
    await fsp.access(src)
    
    await tarGzDir(src, out, CONFIG.MC_DIR)
    const stat = await fsp.stat(out)
    return { id: name, path: out, size: stat.size, createdAt: stat.mtimeMs }
  } catch (error) {
    // Cleanup: rimuovi file parziale se esiste
    try {
      await fsp.rm(out, { force: true })
    } catch {
      // Ignora errori di cleanup
    }
    
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Backup creation failed: ${errorMsg}`)
  }
}

export const restoreBackup = async (id: string): Promise<void> => {
  await ensureDirs()
  const file = path.join(CONFIG.BACKUP_DIR, id)
  
  // Validazione input
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid backup ID')
  }
  
  // Controlla che il file esista
  try {
    await fsp.access(file)
  } catch {
    throw new Error(`Backup file not found: ${id}`)
  }
  
  // Controlla che il file sia un backup valido (tar.gz)
  if (!id.endsWith('.tar.gz')) {
    throw new Error('Invalid backup file format')
  }
  
  let serverWasStopped = false
  
  try {
    // Stoppa il processo
    await processManager.stop()
    serverWasStopped = true
    
    // Crea snapshot di sicurezza
    const snapDir = path.join(CONFIG.BACKUP_DIR, 'snapshots', `snap-${Date.now()}`)
    await fse.copy(CONFIG.MC_DIR, snapDir, { overwrite: true, errorOnExist: false })
    
    // Svuota MC_DIR tranne backup dir
    const items = await fsp.readdir(CONFIG.MC_DIR)
    for (const it of items) {
      const full = path.join(CONFIG.MC_DIR, it)
      if (path.resolve(full) === path.resolve(CONFIG.BACKUP_DIR)) continue
      await fse.remove(full)
    }
    
    // Estrai tar.gz nella root MC_DIR
    const extract = (await import('tar')).extract
    await extract({ file, cwd: CONFIG.MC_DIR, strict: true })
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    
    // Sempre riavvia il server, anche se restore è fallito
    if (serverWasStopped) {
      try {
        await processManager.start()
      } catch (startError) {
        const startErrorMsg = startError instanceof Error ? startError.message : 'Unknown start error'
        throw new Error(`Restore failed: ${errorMsg}. Failed to restart server: ${startErrorMsg}`)
      }
    }
    
    throw new Error(`Backup restore failed: ${errorMsg}`)
  }
  
  // Riavvia il server se tutto è andato bene
  try {
    await processManager.start()
  } catch (startError) {
    const startErrorMsg = startError instanceof Error ? startError.message : 'Unknown start error'
    throw new Error(`Backup restored successfully but failed to restart server: ${startErrorMsg}`)
  }
}

export const applyRetention = async (): Promise<void> => {
  await ensureDirs()
  const days = CONFIG.RETENTION_DAYS
  const weeks = CONFIG.RETENTION_WEEKS
  const now = Date.now()
  const items = await listBackups()
  const keep = new Set<string>()
  // mantieni tutti entro N giorni
  for (const b of items) {
    if (now - b.createdAt <= days * 24 * 60 * 60 * 1000) keep.add(b.id)
  }
  // per le settimane precedenti, mantieni il più recente per settimana
  const byWeek = new Map<string, BackupInfo>()
  for (const b of items) {
    const age = now - b.createdAt
    if (age <= days * 24 * 60 * 60 * 1000) continue
    const d = new Date(b.createdAt)
    const weekKey = `${d.getUTCFullYear()}-w${Math.ceil((d.getUTCDate() + (new Date(d.getUTCFullYear(), 0, 1).getUTCDay() || 7)) / 7)}`
    const cur = byWeek.get(weekKey)
    if (!cur || b.createdAt > cur.createdAt) byWeek.set(weekKey, b)
  }
  const weeksKeys = [...byWeek.keys()].sort().slice(-weeks)
  for (const k of weeksKeys) keep.add(byWeek.get(k)!.id)
  // rimuovi il resto
  for (const b of items) {
    if (!keep.has(b.id)) {
      await fsp.rm(b.path, { force: true })
    }
  }
}
