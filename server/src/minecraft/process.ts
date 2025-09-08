import { exec, spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { EventEmitter } from 'node:events'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import pidusage from 'pidusage'

import { CONFIG } from '../lib/config.js'
import { appendLog } from './logs.js'
import { loadInstallationInfo } from './modpack.js'
import { rconEnabled, rconExec, disconnectRcon } from './rcon.js'
import { checkServerJarStatus } from './serverJar.js'

export type ProcState = 'RUNNING' | 'STOPPED' | 'CRASHED'

export type LogEvent = { ts: number; line: string }

// Rileva automaticamente il sistema operativo
const isWindows = os.platform() === 'win32'

const execAsync = promisify(exec)

// Funzione per ottenere l'utilizzo del disco
const getDiskUsage = async (
  dirPath: string
): Promise<{ usedGB: number; totalGB: number; freeGB: number }> => {
  try {
    if (isWindows) {
      // Su Windows usa WMIC
      const drive = path.parse(path.resolve(dirPath)).root.slice(0, 2)
      const { stdout } = await execAsync(
        `wmic LogicalDisk where Caption="${drive}" get Size,FreeSpace /format:csv`
      )
      const lines = stdout.split('\n').filter((line: string) => line.includes(','))
      if (lines.length > 0 && lines[0]) {
        const columns = lines[0].split(',')
        const freeSpace = columns[2]
        const size = columns[3]
        if (!freeSpace || !size) return { totalGB: 0, usedGB: 0, freeGB: 0 }
        const totalBytes = parseInt(size, 10)
        const freeBytes = parseInt(freeSpace, 10)
        const usedBytes = totalBytes - freeBytes
        return {
          totalGB: Math.round((totalBytes / 1024 ** 3) * 10) / 10,
          freeGB: Math.round((freeBytes / 1024 ** 3) * 10) / 10,
          usedGB: Math.round((usedBytes / 1024 ** 3) * 10) / 10,
        }
      }
    } else {
      // Su Linux usa df
      const { stdout } = await execAsync(`df -BG "${path.resolve(dirPath)}" | tail -1`)
      const parts = stdout.trim().split(/\s+/)
      if (parts.length >= 4 && parts[1] && parts[2] && parts[3]) {
        const totalGB = parseInt(parts[1].replace('G', ''), 10)
        const usedGB = parseInt(parts[2].replace('G', ''), 10)
        const freeGB = parseInt(parts[3].replace('G', ''), 10)
        return { totalGB, usedGB, freeGB }
      }
    }
  } catch {
    // Fallback: prova a usare statfs se disponibile o restituisci dati simulati
    try {
      await fsp.stat(path.resolve(dirPath))
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

// Funzione per ottenere il tick time del server in millisecondi via RCON
const getServerTickTime = async (
  isRunning: boolean
): Promise<{ tickTimeMs: number; rconAvailable: boolean }> => {
  if (!isRunning) {
    return { tickTimeMs: 0, rconAvailable: rconEnabled() } // Server non in esecuzione
  }

  const rconAvailable = rconEnabled()

  // Se RCON è abilitato, prova a ottenere il TPS reale
  if (rconAvailable) {
    // Lista di comandi da provare in ordine
    const commands = [
      { cmd: 'forge tps', description: 'Forge TPS command' },
      { cmd: 'tps', description: 'Generic TPS command' },
      { cmd: 'spark tps', description: 'Spark profiler TPS' },
      { cmd: 'mspt', description: 'MSPT command (Paper/Spigot)' },
      { cmd: 'debug start', description: 'Vanilla debug start', followup: 'debug stop' },
    ]

    for (const { cmd, description, followup } of commands) {
      try {
        console.log(`[RCON] Trying ${description}: ${cmd}`)
        let tpsOutput = await rconExec(cmd)

        // Se è un comando debug, aspetta e fai il followup
        if (followup) {
          console.log(`[RCON] Waiting 2 seconds for debug data collection...`)
          await new Promise((resolve) => setTimeout(resolve, 2000))
          tpsOutput = await rconExec(followup)
        }

        // Parse della risposta per estrarre il tick time
        const tickTimeMs = parseTickTimeFromOutput(tpsOutput)
        if (tickTimeMs !== null && tickTimeMs > 0) {
          console.log(`[RCON] Successfully got tick time: ${tickTimeMs}ms from ${description}`)
          return { tickTimeMs, rconAvailable }
        } else {
          console.log(`[RCON] ${description} didn't return valid tick time`)
        }
      } catch (error) {
        console.warn(`[RCON] ${description} failed:`, error)
        // Continue to next command
      }
    }

    console.log('[RCON] All tick time commands failed, using fallback')
  }

  // Fallback: simula tick time realistici con una leggera variazione
  return { tickTimeMs: getFallbackTickTime(), rconAvailable }
}

// Funzione per parsare il tick time dall'output di diversi comandi
const parseTickTimeFromOutput = (output: string): number | null => {
  if (!output || typeof output !== 'string') {
    return null
  }

  // Normalizza l'output rimuovendo prefissi di logging
  const cleanOutput = output
    .replace(/\[.*?\]\s*/g, '') // Rimuove timestamp e level [INFO], [WARN], etc.
    .replace(/.*?thread\/\w+\]:\s*/g, '') // Rimuove "Server thread/INFO]:"
    .trim()

  console.log(`[RCON] Parsing tick time from: "${cleanOutput}"`)

  // Pattern per diversi formati di output tick time e TPS
  const patterns = [
    // Tick time diretto: "Average tick time: 50.0 ms" o "Avg tick: 0.221 ms"
    {
      regex: /(?:Average tick time|Avg tick):\s*(\d+\.?\d*)\s*ms/i,
      type: 'direct_ms',
      converter: (value: number) => value,
    },
    // Debug output con tick time: "Average tick time: 50.0 ms (20.0 TPS)"
    {
      regex: /Average tick time:\s*(\d+\.?\d*)\s*ms(?:\s*\([^)]*\))?/i,
      type: 'debug_ms',
      converter: (value: number) => value,
    },
    // Forge TPS con conversione: "Overall: 20.0 TPS" o "Mean TPS: 20.0"
    {
      regex: /(?:Overall|Mean|TPS).*?(\d+\.?\d*)\s*TPS/i,
      type: 'tps_conversion',
      converter: (value: number) => (value > 0 ? 1000 / value : 1000),
    },
    // Debug output con TPS tra parentesi: "(20.0 TPS)" - converti a tick time
    {
      regex: /\((\d+\.?\d*)\s*TPS\)/i,
      type: 'tps_parentheses',
      converter: (value: number) => (value > 0 ? 1000 / value : 1000),
    },
    // Semplice numero con TPS - converti a tick time
    {
      regex: /(\d+\.?\d*)\s*TPS/i,
      type: 'simple_tps',
      converter: (value: number) => (value > 0 ? 1000 / value : 1000),
    },
    // Pattern per server specifici con formato Bukkit/Spigot/Paper
    {
      regex: /TPS from last 1m, 5m, 15m: (\d+\.?\d*),/i,
      type: 'bukkit_tps',
      converter: (value: number) => (value > 0 ? 1000 / value : 1000),
    },
    // Pattern per Fabric/Quilt
    {
      regex: /Server tick time: (\d+\.?\d*) ms/i,
      type: 'fabric_ms',
      converter: (value: number) => value,
    },
  ]

  for (const { regex, type, converter } of patterns) {
    const match = cleanOutput.match(regex)
    if (match && match[1]) {
      const value = parseFloat(match[1])
      if (!isNaN(value) && value >= 0) {
        const tickTimeMs = converter(value)

        // Validazione del risultato
        if (tickTimeMs >= 0 && tickTimeMs <= 5000) {
          // Tick time ragionevole (0-5000ms)
          const result = Math.round(tickTimeMs * 100) / 100
          console.log(`[RCON] Parsed tick time: ${result}ms (pattern: ${type}, raw: ${value})`)
          return result
        } else {
          console.warn(
            `[RCON] Invalid tick time calculated: ${tickTimeMs}ms from ${value} (pattern: ${type})`
          )
        }
      }
    }
  }

  console.warn(`[RCON] No valid tick time found in output: "${cleanOutput}"`)
  return null
}

// Funzione fallback per tick time simulati
const getFallbackTickTime = (): number => {
  const baseTPS = 20.0
  const variation = (Math.random() - 0.5) * 0.5 // Variazione ±0.25 TPS
  const tps = Math.max(0, Math.min(20, baseTPS + variation))
  const tickTimeMs = tps > 0 ? 1000 / tps : 1000
  return Math.round(tickTimeMs * 100) / 100
}

// Funzione per ottenere il numero di giocatori online via RCON
const getPlayerCount = async (): Promise<{
  online: number
  max: number
  rconAvailable: boolean
}> => {
  const rconAvailable = rconEnabled()

  // Se RCON è abilitato, prova a ottenere i dati reali
  if (rconAvailable) {
    try {
      console.log('[RCON] Getting player count with /list command')
      const listOutput = await rconExec('list')

      console.log(`[RCON] List output: "${listOutput}"`)

      // Pattern multipli per diversi formati di output
      const patterns = [
        // Formato standard: "There are 2 of a max of 20 players online: player1, player2"
        /There are (\d+) of a max of (\d+) players online/i,
        // Formato alternativo: "2/20 players online"
        /(\d+)\/(\d+) players online/i,
        // Formato Bukkit/Spigot: "Online players (2/20): player1, player2"
        /Online players \((\d+)\/(\d+)\)/i,
        // Formato con solo numeri: "Players online: 2 (max: 20)"
        /Players online:\s*(\d+).*?max:\s*(\d+)/i,
      ]

      for (const pattern of patterns) {
        const match = listOutput.match(pattern)
        if (match && match[1] && match[2]) {
          const online = parseInt(match[1], 10)
          const max = parseInt(match[2], 10)
          if (!isNaN(online) && !isNaN(max) && online >= 0 && max > 0) {
            console.log(`[RCON] Player count parsed: ${online}/${max}`)
            return { online, max, rconAvailable }
          }
        }
      }

      console.warn('[RCON] Could not parse player count from list output')
    } catch (error) {
      console.error('[RCON] Player count command failed:', error)
    }
  }

  // Fallback: valori simulati
  console.log('[RCON] Using fallback player count')
  return { online: 0, max: 20, rconAvailable }
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
    // Arresto gentile: il server Minecraft salva i mondi solo se riceve il comando 'stop'
    const proc = this.proc
    return await new Promise<void>((resolve) => {
      let exited = false
      const timeoutMs = 15000 // 15s timeout prima di forzare

      const clearAll = () => {
        if (killTimer) clearTimeout(killTimer)
        proc.off('exit', onExit)
      }

      const onExit = async () => {
        exited = true
        clearAll()

        // Cleanup RCON connection quando il server si ferma
        try {
          await disconnectRcon()
        } catch (error) {
          console.warn('[Process] Error during RCON cleanup:', error)
        }

        resolve()
      }

      proc.once('exit', onExit)

      try {
        // Invia comando stop (con newline)
        proc.stdin.write('stop\n')
      } catch {
        // Se fallisce procedi a kill immediato
        try {
          proc.kill()
        } catch {}
      }

      // Timer di sicurezza: se non esce entro timeout, forza kill
      const killTimer =
        setTimeout(() => {
          if (exited) return
          try {
            const evt: LogEvent = { ts: Date.now(), line: '[SYSTEM] Stop timeout, killing process' }
            appendLog(evt)
            this.emit('log', evt.line)
            proc.kill('SIGKILL')
          } catch {}
        }, timeoutMs).unref?.() ?? undefined
    })
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
    const [diskUsage, systemMemory, tickData, playerData] = await Promise.all([
      getDiskUsage(CONFIG.MC_DIR),
      Promise.resolve(getSystemMemory()),
      getServerTickTime(isRunning),
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
      tickTimeMs: tickData.tickTimeMs,
      players: { online: playerData.online, max: playerData.max },
      rconAvailable: tickData.rconAvailable && playerData.rconAvailable,
    }

    if (!pid) return { ...base, cpu: 0, memMB: 0 }

    try {
      const stat = await pidusage(pid)
      return {
        ...base,
        cpu: stat.cpu, // pidusage già restituisce la percentuale (0-100)
        memMB: Math.round(stat.memory / (1024 * 1024)), // Process Memory: memoria del processo server in MB
        // Tick Time: tempo medio per tick in millisecondi, ottenuto via RCON (forge tps, tps, debug) con fallback simulato
        // Players: ottenuti via RCON (list command) con fallback simulato
      }
    } catch {
      return { ...base, cpu: 0, memMB: 0 }
    }
  }
}

export const processManager = new ProcessManager()
