import type { FastifyInstance, FastifyPluginCallback } from 'fastify'
import fs from 'node:fs'
import path from 'node:path'

import { CONFIG } from '../lib/config.js'

// Funzione per leggere e parsare server.properties
const readServerProperties = (): Record<string, string> => {
  const propsPath = path.join(CONFIG.MC_DIR, 'server.properties')
  const properties: Record<string, string> = {}

  try {
    const content = fs.readFileSync(propsPath, 'utf8')
    const lines = content.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          properties[key.trim()] = valueParts.join('=').trim()
        }
      }
    }
  } catch (error) {
    console.warn('Could not read server.properties:', error)
  }

  return properties
}

// Funzione per scrivere server.properties
const writeServerProperties = (properties: Record<string, string>): void => {
  const propsPath = path.join(CONFIG.MC_DIR, 'server.properties')

  try {
    // Leggi il file esistente per preservare i commenti
    let content = ''
    try {
      content = fs.readFileSync(propsPath, 'utf8')
    } catch {
      // File non esiste, creiamo uno di base
      content = '# Minecraft server properties\n'
    }

    const lines = content.split('\n')
    const updatedLines: string[] = []
    const processedKeys = new Set<string>()

    // Aggiorna le linee esistenti
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key] = trimmed.split('=')
        if (key && properties[key.trim()]) {
          updatedLines.push(`${key.trim()}=${properties[key.trim()]}`)
          processedKeys.add(key.trim())
        } else {
          updatedLines.push(line)
        }
      } else {
        updatedLines.push(line)
      }
    }

    // Aggiungi nuove proprietà
    for (const [key, value] of Object.entries(properties)) {
      if (!processedKeys.has(key)) {
        updatedLines.push(`${key}=${value}`)
      }
    }

    fs.writeFileSync(propsPath, updatedLines.join('\n'))
  } catch (error) {
    throw new Error(`Failed to write server.properties: ${error}`)
  }
}

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  fastify.get('/api/settings', { preHandler: fastify.authorize('viewer') }, async () => {
    return {
      javaBin: CONFIG.JAVA_BIN,
      mcDir: CONFIG.MC_DIR,
      backupDir: CONFIG.BACKUP_DIR,
      rcon: { enabled: CONFIG.RCON_ENABLED, host: CONFIG.RCON_HOST, port: CONFIG.RCON_PORT },
      backupCron: CONFIG.BACKUP_CRON,
      retentionDays: CONFIG.RETENTION_DAYS,
      retentionWeeks: CONFIG.RETENTION_WEEKS,
    }
  })

  // API per attivare RCON nel server.properties
  fastify.post(
    '/api/settings/enable-rcon',
    { preHandler: fastify.authorize('owner') },
    async (request, reply) => {
      try {
        const properties = readServerProperties()

        // Abilita RCON con impostazioni predefinite
        properties['enable-rcon'] = 'true'
        properties['rcon.port'] = CONFIG.RCON_PORT.toString()

        // Genera una password RCON se non è specificata
        let rconPassword = CONFIG.RCON_PASS
        if (!rconPassword) {
          rconPassword = Math.random().toString(36).substring(2, 15)
        }
        properties['rcon.password'] = rconPassword

        writeServerProperties(properties)

        return {
          success: true,
          message: 'RCON enabled in server.properties',
          rconPassword: rconPassword,
          rconPort: CONFIG.RCON_PORT,
          note: 'Server restart required for changes to take effect',
        }
      } catch (error) {
        reply.status(500)
        return { success: false, error: (error as Error).message }
      }
    }
  )

  done()
}

export { plugin as settingsRoutes }
