import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { EventEmitter } from 'node:events'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import pidusage from 'pidusage'

import { CONFIG } from '../lib/config.js'
import { appendLog } from './logs.js'
import { checkServerJarStatus } from './serverJar.js'

export type ProcState = 'RUNNING' | 'STOPPED' | 'CRASHED'

export type LogEvent = { ts: number; line: string }

// Rileva automaticamente il sistema operativo
const isWindows = os.platform() === 'win32'

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
        const jarStatus = await checkServerJarStatus()
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

        const args = [...jvmArgs, '-jar', jarStatus.jarName, 'nogui']
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
    const base = {
      state: this._state,
      pid: pid ?? null,
      uptimeMs,
      running: this._state === 'RUNNING',
    }
    if (!pid) return { ...base, cpu: 0, memMB: 0 }
    try {
      const stat = await pidusage(pid)
      return { ...base, cpu: stat.cpu / 100, memMB: Math.round(stat.memory / (1024 * 1024)) }
    } catch {
      return { ...base, cpu: 0, memMB: 0 }
    }
  }
}

export const processManager = new ProcessManager()
