import type { FastifyInstance } from 'fastify'
import { spawn } from 'node:child_process'

import { CONFIG } from './config.js'

export const checkJavaBin = (app: FastifyInstance) => {
  try {
    const child = spawn(CONFIG.JAVA_BIN, ['-version'], { stdio: ['ignore', 'pipe', 'pipe'] })
    const chunks: Array<Buffer> = []
    const errChunks: Array<Buffer> = []
    child.stdout.on('data', (c) => chunks.push(Buffer.from(c)))
    child.stderr.on('data', (c) => errChunks.push(Buffer.from(c)))
    // Se il binario non esiste (ENOENT) o ci sono altri problemi di spawn,
    // catturiamo l'evento 'error' per evitare che il processo principale crashi.
    child.on('error', (err: unknown) => {
      const code = (err as NodeJS.ErrnoException).code
      if (code === 'ENOENT') {
        app.log.warn(
          { bin: CONFIG.JAVA_BIN },
          'JAVA_BIN non trovato nel PATH o percorso non valido; alcune feature Minecraft potrebbero non funzionare',
        )
      } else {
        app.log.warn({ err }, 'Errore durante l\'esecuzione del controllo JAVA_BIN')
      }
      try {
        child.kill('SIGKILL')
      } catch {
        // ignore
      }
    })
    const timer = setTimeout(() => {
      try {
        child.kill('SIGKILL')
      } catch {
        // ignore
      }
    }, 5000)
    child.on('close', () => {
      clearTimeout(timer)
      const out = Buffer.concat(chunks).toString('utf8') + Buffer.concat(errChunks).toString('utf8')
      const versionLine = out.split('\n').find((l) => l.toLowerCase().includes('version'))
      if (!versionLine) {
        app.log.warn('JAVA_BIN check: unable to detect Java version')
        return
      }
      const m = versionLine.match(/version\s+"([^"]+)"/i)
      const v = m?.[1]
      if (!v) {
        app.log.warn({ versionLine }, 'JAVA_BIN check: cannot parse version')
        return
      }
      const major = Number(v.split('.')[0]) || (v.startsWith('1.') ? Number(v.split('.')[1]) : NaN)
      if (Number.isNaN(major)) {
        app.log.warn({ v }, 'JAVA_BIN check: unknown version format')
      } else if (major < 17) {
        app.log.warn({ v }, 'JAVA_BIN is too old; Minecraft servers require Java 17+')
      } else {
        app.log.info({ v }, 'JAVA_BIN OK')
      }
    })
  } catch (err) {
    app.log.warn({ err }, 'JAVA_BIN check failed to spawn')
  }
}
