import fs from 'node:fs'
import path from 'node:path'
import { Rcon } from 'rcon-client'

import { CONFIG } from '../lib/config.js'

export type RconClient = InstanceType<typeof Rcon>

let client: RconClient | null = null
const MAX_RETRIES = 3
const CONNECTION_TIMEOUT = 5000 // 5 secondi
const COMMAND_TIMEOUT = 3000 // 3 secondi

// Funzione per leggere e verificare se RCON è abilitato dal server.properties
const readRconConfigFromProperties = (): { enabled: boolean; port: number; password: string } => {
  const propsPath = path.join(CONFIG.MC_DIR, 'server.properties')
  const defaultConfig = { enabled: false, port: CONFIG.RCON_PORT, password: CONFIG.RCON_PASS }

  try {
    const content = fs.readFileSync(propsPath, 'utf8')
    const lines = content.split('\n')
    const properties: Record<string, string> = {}

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          properties[key.trim()] = valueParts.join('=').trim()
        }
      }
    }

    const enabled = properties['enable-rcon'] === 'true'
    const port = properties['rcon.port']
      ? parseInt(properties['rcon.port'], 10)
      : defaultConfig.port
    const password = properties['rcon.password'] || defaultConfig.password

    return { enabled, port, password }
  } catch (error: unknown) {
    console.warn('Could not read server.properties for RCON config:', error)
    // Fallback alle variabili d'ambiente se server.properties non è leggibile
    return {
      enabled: CONFIG.RCON_ENABLED,
      port: CONFIG.RCON_PORT,
      password: CONFIG.RCON_PASS,
    }
  }
}

export const rconEnabled = (): boolean => {
  const config = readRconConfigFromProperties()
  return config.enabled && config.password.length > 0
}

export const getRcon = async (): Promise<RconClient> => {
  if (!rconEnabled()) throw new Error('RCON disabled')

  // Se c'è un client esistente, verifica che sia ancora connesso
  if (client) {
    try {
      // Test semplice per verificare la connessione
      await client.send('list')
      return client
    } catch {
      // Connessione non valida, cleanup e riconnetti
      client = null
    }
  }

  const config = readRconConfigFromProperties()

  // Retry logic per la connessione
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[RCON] Attempting connection ${attempt}/${MAX_RETRIES}...`)

      const connectPromise = Rcon.connect({
        host: CONFIG.RCON_HOST,
        port: config.port,
        password: config.password,
      })

      // Timeout per la connessione
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT)
      )

      client = await Promise.race([connectPromise, timeoutPromise])

      client.on('end', () => {
        console.log('[RCON] Connection ended')
        client = null
      })

      client.on('error', (error: unknown) => {
        console.error('[RCON] Connection error:', error)
        client = null
      })

      console.log('[RCON] Connection established successfully')
      return client
    } catch (error: unknown) {
      console.warn(`[RCON] Connection attempt ${attempt} failed:`, error)

      if (attempt === MAX_RETRIES) {
        throw new Error(`RCON connection failed after ${MAX_RETRIES} attempts: ${error}`)
      }

      // Aspetta prima del prossimo tentativo
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }

  throw new Error('Failed to establish RCON connection')
}

export const rconExec = async (cmd: string): Promise<string> => {
  const c = await getRcon()

  // Timeout per i comandi
  const commandPromise = c.send(cmd)
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Command timeout')), COMMAND_TIMEOUT)
  )

  try {
    const res = await Promise.race([commandPromise, timeoutPromise])
    const result = typeof res === 'string' ? res : String(res)
    console.log(
      `[RCON] Command "${cmd}" result: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`
    )
    return result
  } catch (error: unknown) {
    console.error(`[RCON] Command "${cmd}" failed:`, error)
    // Invalidate client on command failure
    client = null
    throw error
  }
}

// Funzione per cleanup esplicito della connessione
export const disconnectRcon = async (): Promise<void> => {
  if (client) {
    try {
      await client.end()
    } catch (error: unknown) {
      console.warn('[RCON] Error during disconnect:', error)
    } finally {
      client = null
    }
  }
}
