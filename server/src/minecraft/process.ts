import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { EventEmitter } from 'node:events'
import path from 'node:path'

import { CONFIG } from '../lib/config.js'
import { appendLog } from './logs.js'

export type ProcState = 'RUNNING' | 'STOPPED' | 'CRASHED'

export type LogEvent = { ts: number; line: string }

class ProcessManager extends EventEmitter {
  private proc: ChildProcessWithoutNullStreams | null = null
  private _state: ProcState = 'STOPPED'

  get state() {
    return this._state
  }

  start = async (): Promise<void> => {
    if (this.proc) return
    try {
      // Placeholder: avvia una JVM standard; l'utente dovrà configurare jar/args reali in step successivi
      const jar = path.join(CONFIG.MC_DIR, 'server.jar')
      const args = ['-Xmx1G', '-Xms1G', '-jar', jar, 'nogui']
      const proc = spawn(CONFIG.JAVA_BIN, args, { cwd: CONFIG.MC_DIR, stdio: 'pipe' })
      this.proc = proc
      this._state = 'RUNNING'
      this.emit('status', { state: this._state } as const)

      const onData = (buf: Buffer) => {
        const lines = buf.toString('utf8').split(/\r?\n/)
        for (const l of lines) {
          if (!l) continue
          const evt: LogEvent = { ts: Date.now(), line: l }
          appendLog(evt)
          this.emit('log', evt)
        }
      }
      proc.stdout.on('data', onData)
      proc.stderr.on('data', onData)
      proc.on('exit', () => {
        this.proc = null
        this._state = 'STOPPED'
        this.emit('status', { state: this._state } as const)
      })
      proc.on('error', (err) => {
        const evt: LogEvent = { ts: Date.now(), line: `[PROC ERROR] ${String(err.message ?? err)}` }
        appendLog(evt)
        this.emit('log', evt)
        this._state = 'CRASHED'
        this.emit('status', { state: this._state } as const)
      })
    } catch (err) {
      this._state = 'CRASHED'
      this.emit('status', { state: this._state } as const)
      const evt: LogEvent = {
        ts: Date.now(),
        line: `[START ERROR] ${String((err as Error).message)}`,
      }
      appendLog(evt)
      this.emit('log', evt)
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
}

export const processManager = new ProcessManager()
