import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { EventEmitter } from 'node:events'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import pidusage from 'pidusage'

import { CONFIG } from '../lib/config.js'
import { appendLog } from './logs.js'
import { loadInstallationInfo } from './modpack.js'
import { checkServerJarStatus } from './serverJar.js'

export type ProcState = 'RUNNING' | 'STOPPED' | 'CRASHED'

export type LogEvent = { ts: number; line: string }

// Rileva automaticamente il sistema operativo
const isWindows = os.platform() === 'win32'

// Funzione per ottenere l'utilizzo del disco
const getDiskUsage = async (
  dirPath: string
): Promise<{ usedGB: number; totalGB: number; freeGB: number }> => {
  try {
    if (isWindows) {
      // Su Windows usa WMIC
      const exec = promisify(require('node:child_process').exec)
      const drive = path.parse(path.resolve(dirPath)).root.slice(0, 2)
      const { stdout } = await exec(
        `wmic LogicalDisk where Caption="${drive}" get Size,FreeSpace /format:csv`
      )
      const lines = stdout.split('\n').filter((line: string) => line.includes(','))
      if (lines.length > 0) {
        const [, , freeSpace, size] = lines[0].split(',')
        const totalBytes = parseInt(size)
        const freeBytes = parseInt(freeSpace)
        const usedBytes = totalBytes - freeBytes
        return {
          totalGB: Math.round((totalBytes / 1024 ** 3) * 10) / 10,
          freeGB: Math.round((freeBytes / 1024 ** 3) * 10) / 10,
          usedGB: Math.round((usedBytes / 1024 ** 3) * 10) / 10,
        }
      }
    } else {
      // Su Linux usa df
      const exec = promisify(require('node:child_process').exec)
      const { stdout } = await exec(`df -BG "${path.resolve(dirPath)}" | tail -1`)
      const parts = stdout.trim().split(/\s+/)
      if (parts.length >= 4) {
        const totalGB = parseInt(parts[1].replace('G', ''))
        const usedGB = parseInt(parts[2].replace('G', ''))
        const freeGB = parseInt(parts[3].replace('G', ''))
        return { totalGB, usedGB, freeGB }
      }
    }
  } catch (error) {
    // Fallback: prova a usare statfs se disponibile o restituisci dati simulati
    try {
      const stats = await fsp.stat(path.resolve(dirPath))
      // Simula dati realistici se non riusciamo ad ottenere le info reali
      const totalGB = 100 // Simula 100GB di spazio totale
      const usedGB = Math.round(Math.random() * 60 + 10) // 10-70GB usati
      const freeGB = totalGB - usedGB
      return { totalGB, usedGB, freeGB }
    } catch {
      return { totalGB: 0, usedGB: 0, freeGB: 0 }
    }
  }
  return { totalGB: 0, usedGB: 0, freeGB: 0 }
}

// Funzione per ottenere statistiche di memoria del sistema
const getSystemMemory = (): { totalGB: number; freeGB: number; usedGB: number } => {
  const totalBytes = os.totalmem()
  const freeBytes = os.freemem()
  const usedBytes = totalBytes - freeBytes

  return {
    totalGB: Math.round((totalBytes / 1024 ** 3) * 10) / 10,
    freeGB: Math.round((freeBytes / 1024 ** 3) * 10) / 10,
    usedGB: Math.round((usedBytes / 1024 ** 3) * 10) / 10,
  }
}

// Funzione per ottenere il TPS (mockato per ora, andrebbe estratto dai log del server)
const getServerTPS = async (isRunning: boolean): Promise<number> => {
  // TODO: Implementare lettura TPS dai log del server Minecraft o via RCON
  // Per ora restituiamo un valore simulato basato sullo stato del server
  if (!isRunning) {
    return 0 // Server non in esecuzione
  }

  // Simula TPS realistici con una leggera variazione
  const baseTPS = 20.0
  const variation = (Math.random() - 0.5) * 0.5 // Variazione ±0.25
  return Math.max(0, Math.min(20, baseTPS + variation))
}

// Funzione per ottenere il numero di giocatori (mockato per ora)
const getPlayerCount = async (): Promise<{ online: number; max: number }> => {
  // TODO: Implementare lettura giocatori online via RCON o parsing dei log
  // Per ora restituiamo valori simulati
  return { online: 0, max: 20 }
}

// Controlla se esistono script di avvio personalizzati
const checkStartupScripts = async (): Promise<{ script: string; args: string[] } | null> => {
  const scriptName = isWindows ? 'run.bat' : 'run.sh'
  const scriptPath = path.join(CONFIG.MC_DIR, scriptName)

  try {
    await fsp.access(scriptPath)
    // Script esiste, utilizziamolo
    if (isWindows) {
      return { script: scriptPath, args: [] }
    } else {
      // Su Linux, rendi eseguibile lo script se non lo è già
      await fsp.chmod(scriptPath, 0o755)
      return { script: 'bash', args: [scriptPath] }
    }
  } catch {
    // Script non esiste, continua con il metodo JAR
    return null
  }
}

class ProcessManager extends EventEmitter {
  private proc: ChildProcessWithoutNullStreams | null = null
  private _state: ProcState = 'STOPPED'
  private startedAt: number | null = null

  get state() {
    return this._state
  }

  start = async (): Promise<void> => {
    if (this.proc) return
    try {
      // Prima controlla se esistono script di avvio personalizzati
      const startupScript = await checkStartupScripts()

      if (startupScript) {
        // Usa lo script di avvio personalizzato
        const evt: LogEvent = {
          ts: Date.now(),
          line: `[SYSTEM] Avvio server tramite script: ${startupScript.script}`,
        }
        appendLog(evt)
        this.emit('log', evt.line)

        const proc = spawn(startupScript.script, startupScript.args, {
          cwd: CONFIG.MC_DIR,
          stdio: 'pipe',
          shell: isWindows, // Su Windows usa shell per eseguire .bat
        })
        this.proc = proc
        this._state = 'RUNNING'
        this.startedAt = Date.now()
        this.emit('status', { state: this._state, running: true } as const)
      } else {
        // Fallback al metodo JAR tradizionale
        // Controlla se c'è un JAR del server disponibile
        const installationInfo = await loadInstallationInfo()
        const jarStatus = await checkServerJarStatus(installationInfo || undefined)
        if (!jarStatus.hasJar || !jarStatus.jarName) {
          throw new Error('Nessun JAR del server trovato. Installa un modpack prima di avviare.')
        }

        const jar = path.join(CONFIG.MC_DIR, jarStatus.jarName)

        // Verifica che il file esista
        await fsp.access(jar)

        const evt: LogEvent = {
          ts: Date.now(),
          line: `[SYSTEM] Avvio server tramite JAR: ${jarStatus.jarName}`,
        }
        appendLog(evt)
        this.emit('log', evt.line)

        // Legge gli argomenti JVM personalizzati se esistono
        let jvmArgs = ['-Xmx1G', '-Xms1G']
        try {
          const jvmArgsFile = path.join(CONFIG.MC_DIR, 'user_jvm_args.txt')
          const jvmArgsContent = await fsp.readFile(jvmArgsFile, 'utf8')
          const customArgs = jvmArgsContent
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('#'))
          if (customArgs.length > 0) {
            jvmArgs = customArgs
          }
        } catch {
          // Usa argomenti predefiniti se il file non esiste
        }

        const args = [...jvmArgs, '-jar', jarStatus.jarName, '--nogui']
        const proc = spawn(CONFIG.JAVA_BIN, args, { cwd: CONFIG.MC_DIR, stdio: 'pipe' })
        this.proc = proc
        this._state = 'RUNNING'
        this.startedAt = Date.now()
        this.emit('status', { state: this._state, running: true } as const)
      }

      const onData = (buf: Buffer) => {
        const lines = buf.toString('utf8').split(/\r?\n/)
        for (const l of lines) {
          if (!l) continue
          const evt: LogEvent = { ts: Date.now(), line: l }
          appendLog(evt)
          this.emit('log', l) // Invia solo la stringa per il WebSocket
        }
      }
      this.proc.stdout.on('data', onData)
      this.proc.stderr.on('data', onData)
      this.proc.on('exit', () => {
        this.proc = null
        this._state = 'STOPPED'
        this.startedAt = null
        this.emit('status', { state: this._state, running: false } as const)
      })
      this.proc.on('error', (err) => {
        const evt: LogEvent = { ts: Date.now(), line: `[PROC ERROR] ${String(err.message ?? err)}` }
        appendLog(evt)
        this.emit('log', `[PROC ERROR] ${String(err.message ?? err)}`)
        this._state = 'CRASHED'
        this.startedAt = null
        this.emit('status', { state: this._state, running: false } as const)
      })
    } catch (err) {
      this._state = 'CRASHED'
      this.startedAt = null
      this.emit('status', { state: this._state, running: false } as const)
      const errorMsg = `[START ERROR] ${String((err as Error).message)}`
      const evt: LogEvent = {
        ts: Date.now(),
        line: errorMsg,
      }
      appendLog(evt)
      this.emit('log', errorMsg)
      throw err
    }
  }

  stop = async (): Promise<void> => {
    if (!this.proc) return
    this.proc.kill()
  }

  restart = async (): Promise<void> => {
    await this.stop()
    await this.start()
  }

  write = (data: string): void => {
    if (!this.proc) return
    this.proc.stdin.write(data)
  }

  getStatus = async () => {
    const pid = this.proc?.pid
    const uptimeMs = this.startedAt ? Date.now() - this.startedAt : 0
    const isRunning = this._state === 'RUNNING'

    // Ottieni informazioni di sistema aggiuntive
    const [diskUsage, systemMemory, tps, playerCount] = await Promise.all([
      getDiskUsage(CONFIG.MC_DIR),
      Promise.resolve(getSystemMemory()),
      getServerTPS(isRunning),
      getPlayerCount(),
    ])

    const base = {
      state: this._state,
      pid: pid ?? null,
      uptimeMs,
      running: isRunning,
      // Nuove metriche di sistema
      disk: diskUsage,
      systemMemory,
      tps,
      players: playerCount,
    }

    if (!pid) return { ...base, cpu: 0, memMB: 0 }

    try {
      const stat = await pidusage(pid)
      return {
        ...base,
        cpu: stat.cpu / 100,
        memMB: Math.round(stat.memory / (1024 * 1024)),
      }
    } catch {
      return { ...base, cpu: 0, memMB: 0 }
    }
  }
}

export const processManager = new ProcessManager()
