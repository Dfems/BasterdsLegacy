import { spawn } from 'node:child_process'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'

import { CONFIG } from '../lib/config.js'

export type InstallRequest = {
  loader: 'Forge' | 'Fabric' | 'Quilt' | 'NeoForge'
  mcVersion: string
  manifest?: unknown
}

const EULA = 'eula.txt'
const JVM_ARGS = 'user_jvm_args.txt'

export const ensureEula = async () => {
  const file = path.join(CONFIG.MC_DIR, EULA)
  await fsp.mkdir(CONFIG.MC_DIR, { recursive: true })
  await fsp.writeFile(file, 'eula=true\n', 'utf8')
}

export const writeJvmArgs = async () => {
  const file = path.join(CONFIG.MC_DIR, JVM_ARGS)
  const content = ['-Xms1G', '-Xmx2G'].join('\n') + '\n'
  await fsp.writeFile(file, content, 'utf8')
}

const downloadToFile = async (url: string, dest: string): Promise<void> => {
  await fsp.mkdir(path.dirname(dest), { recursive: true })
  await new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https
      .get(url, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          // follow redirect
          const loc = res.headers.location
          res.resume()
          downloadToFile(loc.startsWith('http') ? loc : new URL(loc, url).toString(), dest)
            .then(resolve)
            .catch(reject)
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: ${res.statusCode}`))
          return
        }
        res.pipe(file)
        file.on('finish', () => file.close(() => resolve()))
      })
      .on('error', (err) => reject(err))
  })
}

const runJavaJar = async (jarPath: string, args: string[], cwd: string): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const ps = spawn(CONFIG.JAVA_BIN, ['-jar', jarPath, ...args], {
      cwd,
      stdio: 'inherit',
      shell: false,
    })
    ps.on('error', reject)
    ps.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Installer exited with code ${code}`))
    })
  })
}

export const installModpack = async (
  req: InstallRequest
): Promise<{ ok: true; notes: string[] }> => {
  const notes: string[] = []
  notes.push(`Requested loader=${req.loader} mc=${req.mcVersion}`)
  await ensureEula()
  await writeJvmArgs()
  await fsp.mkdir(CONFIG.MC_DIR, { recursive: true })

  if (req.loader === 'Fabric') {
    // Usa l'installer ufficiale Fabric headless
    const installerJar = path.join(CONFIG.MC_DIR, 'fabric-installer.jar')
    const url =
      'https://maven.fabricmc.net/net/fabricmc/fabric-installer/latest/fabric-installer.jar'
    try {
      await downloadToFile(url, installerJar)
      notes.push('Scaricato fabric-installer.jar')
      await runJavaJar(
        installerJar,
        ['server', '-mcversion', req.mcVersion, '-downloadMinecraft'],
        CONFIG.MC_DIR
      )
      notes.push('Fabric server installato')
    } catch (e) {
      notes.push(`Errore installazione Fabric: ${(e as Error).message}`)
    }
  } else {
    notes.push('Per Forge/NeoForge/Quilt carica l’installer JAR nella directory e riesegui.')
  }

  notes.push('EULA e JVM args configurati.')
  return { ok: true, notes }
}
