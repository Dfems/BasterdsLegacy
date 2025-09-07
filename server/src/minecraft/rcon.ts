import fs from 'node:fs'
import path from 'node:path'
import { Rcon } from 'rcon-client'

import { CONFIG } from '../lib/config.js'

export type RconClient = InstanceType<typeof Rcon>

let client: RconClient | null = null

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
  } catch (error) {
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
  if (client) return client

  const config = readRconConfigFromProperties()
  client = await Rcon.connect({
    host: CONFIG.RCON_HOST,
    port: config.port,
    password: config.password,
  })
  client.on('end', () => {
    client = null
  })
  return client
}

export const rconExec = async (cmd: string): Promise<string> => {
  const c = await getRcon()
  const res = await c.send(cmd)
  return typeof res === 'string' ? res : String(res)
}
