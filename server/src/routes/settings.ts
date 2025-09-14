import multipart from '@fastify/multipart'
import staticPlugin from '@fastify/static'
import type { FastifyInstance, FastifyPluginCallback } from 'fastify'
import fs, { createWriteStream } from 'node:fs'
import { mkdir, unlink } from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'

import { CONFIG, getConfig, invalidateConfigCache } from '../lib/config.js'
import { db } from '../lib/db.js'

const pump = promisify(pipeline)

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
        if (key && properties.hasOwnProperty(key.trim())) {
          // Usa hasOwnProperty per controllare anche valori false/0/""
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
  fastify.register(multipart)

  // Register static files for background images
  fastify.register(staticPlugin, {
    root: path.join(CONFIG.MC_DIR, 'uploads', 'backgrounds'),
    prefix: '/api/settings/background/',
  })

  fastify.get('/api/settings', { preHandler: fastify.authorize('viewer') }, async () => {
    // Usa getConfig per ottenere le configurazioni dal database se disponibili
    const config = await getConfig()
    return {
      javaBin: config.JAVA_BIN,
      mcDir: config.MC_DIR,
      backupDir: config.BACKUP_DIR,
      rcon: { enabled: config.RCON_ENABLED, host: config.RCON_HOST, port: config.RCON_PORT },
      backupCron: config.BACKUP_CRON,
      retentionDays: config.RETENTION_DAYS,
      retentionWeeks: config.RETENTION_WEEKS,
    }
  })

  // Get environment configurations (only owner can view sensitive settings)
  fastify.get('/api/settings/environment', { preHandler: fastify.authorize('owner') }, async () => {
    const config = await getConfig()
    return {
      javaBin: config.JAVA_BIN,
      mcDir: config.MC_DIR,
      backupDir: config.BACKUP_DIR,
      rconEnabled: config.RCON_ENABLED,
      rconHost: config.RCON_HOST,
      rconPort: config.RCON_PORT,
      rconPass: config.RCON_PASS,
      // Configurazioni logging
      logLevel: config.LOG_LEVEL,
      logLevels: config.LOG_LEVELS,
      logDir: config.LOG_DIR,
      logFileEnabled: config.LOG_FILE_ENABLED,
      logRetentionDays: config.LOG_RETENTION_DAYS,
      logMaxFiles: config.LOG_MAX_FILES,
    }
  })

  // Update environment configurations (only owner can modify)
  fastify.put(
    '/api/settings/environment',
    { preHandler: fastify.authorize('owner') },
    async (req, reply) => {
      try {
        const body = req.body as {
          javaBin?: string
          mcDir?: string
          backupDir?: string
          rconEnabled?: boolean
          rconHost?: string
          rconPort?: number
          rconPass?: string
          // Configurazioni logging
          logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
          logLevels?: ('trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'all')[]
          logDir?: string
          logFileEnabled?: boolean
          logRetentionDays?: number
          logMaxFiles?: number
        }

        const updates: Array<{ key: string; value: string }> = []

        // Validazione e preparazione degli aggiornamenti
        if (body.javaBin !== undefined) {
          if (typeof body.javaBin !== 'string' || body.javaBin.trim().length === 0) {
            return reply.status(400).send({ error: 'JAVA_BIN must be a non-empty string' })
          }
          updates.push({ key: 'env.JAVA_BIN', value: body.javaBin.trim() })
        }

        if (body.mcDir !== undefined) {
          if (typeof body.mcDir !== 'string' || body.mcDir.trim().length === 0) {
            return reply.status(400).send({ error: 'MC_DIR must be a non-empty string' })
          }
          updates.push({ key: 'env.MC_DIR', value: body.mcDir.trim() })
        }

        if (body.backupDir !== undefined) {
          if (typeof body.backupDir !== 'string' || body.backupDir.trim().length === 0) {
            return reply.status(400).send({ error: 'BACKUP_DIR must be a non-empty string' })
          }
          updates.push({ key: 'env.BACKUP_DIR', value: body.backupDir.trim() })
        }

        if (body.rconEnabled !== undefined) {
          if (typeof body.rconEnabled !== 'boolean') {
            return reply.status(400).send({ error: 'RCON_ENABLED must be a boolean' })
          }
          updates.push({ key: 'env.RCON_ENABLED', value: body.rconEnabled.toString() })
        }

        if (body.rconHost !== undefined) {
          if (typeof body.rconHost !== 'string' || body.rconHost.trim().length === 0) {
            return reply.status(400).send({ error: 'RCON_HOST must be a non-empty string' })
          }
          updates.push({ key: 'env.RCON_HOST', value: body.rconHost.trim() })
        }

        if (body.rconPort !== undefined) {
          if (!Number.isInteger(body.rconPort) || body.rconPort < 1 || body.rconPort > 65535) {
            return reply
              .status(400)
              .send({ error: 'RCON_PORT must be an integer between 1 and 65535' })
          }
          updates.push({ key: 'env.RCON_PORT', value: body.rconPort.toString() })
        }

        if (body.rconPass !== undefined) {
          if (typeof body.rconPass !== 'string') {
            return reply.status(400).send({ error: 'RCON_PASS must be a string' })
          }
          updates.push({ key: 'env.RCON_PASS', value: body.rconPass })
        }

        // Validazione configurazioni logging
        if (body.logLevel !== undefined) {
          const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
          if (!validLevels.includes(body.logLevel)) {
            return reply.status(400).send({
              error: `LOG_LEVEL must be one of: ${validLevels.join(', ')}`,
            })
          }
          updates.push({ key: 'env.LOG_LEVEL', value: body.logLevel })
        }

        if (body.logLevels !== undefined) {
          const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'all']
          if (!Array.isArray(body.logLevels)) {
            return reply.status(400).send({ error: 'LOG_LEVELS must be an array' })
          }

          for (const level of body.logLevels) {
            if (!validLevels.includes(level)) {
              return reply.status(400).send({
                error: `LOG_LEVELS must contain only: ${validLevels.join(', ')}`,
              })
            }
          }

          // Se contiene 'all', sostituisci con tutti i levels
          let levelsToStore = body.logLevels
          if (body.logLevels.includes('all')) {
            levelsToStore = ['all']
          }

          updates.push({ key: 'env.LOG_LEVELS', value: levelsToStore.join(',') })
        }

        if (body.logDir !== undefined) {
          if (typeof body.logDir !== 'string' || body.logDir.trim().length === 0) {
            return reply.status(400).send({ error: 'LOG_DIR must be a non-empty string' })
          }
          updates.push({ key: 'env.LOG_DIR', value: body.logDir.trim() })
        }

        if (body.logFileEnabled !== undefined) {
          if (typeof body.logFileEnabled !== 'boolean') {
            return reply.status(400).send({ error: 'LOG_FILE_ENABLED must be a boolean' })
          }
          updates.push({ key: 'env.LOG_FILE_ENABLED', value: body.logFileEnabled.toString() })
        }

        if (body.logRetentionDays !== undefined) {
          if (!Number.isInteger(body.logRetentionDays) || body.logRetentionDays < 1) {
            return reply.status(400).send({
              error: 'LOG_RETENTION_DAYS must be a positive integer',
            })
          }
          updates.push({ key: 'env.LOG_RETENTION_DAYS', value: body.logRetentionDays.toString() })
        }

        if (body.logMaxFiles !== undefined) {
          if (!Number.isInteger(body.logMaxFiles) || body.logMaxFiles < 1) {
            return reply.status(400).send({
              error: 'LOG_MAX_FILES must be a positive integer',
            })
          }
          updates.push({ key: 'env.LOG_MAX_FILES', value: body.logMaxFiles.toString() })
        }

        // Aggiorna le impostazioni nel database
        for (const update of updates) {
          await db.setting.upsert({
            where: { key: update.key },
            update: { value: update.value },
            create: { key: update.key, value: update.value },
          })
        }

        // Invalida la cache delle configurazioni
        invalidateConfigCache()

        // Restituisci la configurazione aggiornata
        const updatedConfig = await getConfig()
        return {
          success: true,
          message: `Updated ${updates.length} configuration(s)`,
          config: {
            javaBin: updatedConfig.JAVA_BIN,
            mcDir: updatedConfig.MC_DIR,
            backupDir: updatedConfig.BACKUP_DIR,
            rconEnabled: updatedConfig.RCON_ENABLED,
            rconHost: updatedConfig.RCON_HOST,
            rconPort: updatedConfig.RCON_PORT,
            rconPass: updatedConfig.RCON_PASS,
            // Configurazioni logging
            logLevel: updatedConfig.LOG_LEVEL,
            logLevels: updatedConfig.LOG_LEVELS,
            logDir: updatedConfig.LOG_DIR,
            logFileEnabled: updatedConfig.LOG_FILE_ENABLED,
            logRetentionDays: updatedConfig.LOG_RETENTION_DAYS,
            logMaxFiles: updatedConfig.LOG_MAX_FILES,
          },
        }
      } catch (error) {
        fastify.log.error(`Error updating environment settings: ${(error as Error).message}`)
        return reply.status(500).send({
          error: 'Failed to update environment settings',
          details: (error as Error).message,
        })
      }
    }
  )

  // Get owner UI preferences (background, etc.)
  fastify.get('/api/settings/ui', { preHandler: fastify.authorize('viewer') }, async () => {
    const backgroundImage = await db.setting.findUnique({
      where: { key: 'ui.backgroundImage' },
    })

    return {
      backgroundImage: backgroundImage?.value || null,
    }
  })

  // Update owner UI preferences (only owner can modify)
  fastify.put(
    '/api/settings/ui',
    { preHandler: fastify.authorize('owner') },
    async (req, _reply) => {
      const body = req.body as { backgroundImage?: string | null }

      if (body.backgroundImage !== undefined) {
        if (body.backgroundImage === null) {
          // Remove background image setting
          const existingSetting = await db.setting.findUnique({
            where: { key: 'ui.backgroundImage' },
          })

          if (existingSetting?.value) {
            // Remove old file if exists
            const oldPath = path.join(
              CONFIG.MC_DIR,
              'uploads',
              'backgrounds',
              existingSetting.value
            )
            try {
              await unlink(oldPath)
            } catch {
              // Ignore if file doesn't exist
            }
          }

          await db.setting.deleteMany({
            where: { key: 'ui.backgroundImage' },
          })
        } else {
          // Set or update background image
          await db.setting.upsert({
            where: { key: 'ui.backgroundImage' },
            update: { value: body.backgroundImage },
            create: { key: 'ui.backgroundImage', value: body.backgroundImage },
          })
        }
      }

      return { success: true }
    }
  )

  // Upload background image (only owner can upload)
  fastify.post(
    '/api/settings/background-upload',
    { preHandler: fastify.authorize('owner') },
    async (req, reply) => {
      try {
        const data = await req.file({
          limits: {
            fileSize: 5 * 1024 * 1024, // 5MB max
          },
        })
        if (!data) {
          return reply.status(400).send({ error: 'No file provided' })
        }

        // Validate file type
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedMimes.includes(data.mimetype)) {
          return reply.status(400).send({
            error: 'Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.',
          })
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(CONFIG.MC_DIR, 'uploads', 'backgrounds')
        await mkdir(uploadsDir, { recursive: true })

        // Generate unique filename
        const ext = path.extname(data.filename || 'image.jpg')
        const filename = `background-${Date.now()}${ext}`
        const filepath = path.join(uploadsDir, filename)

        // Write file
        const writeStream = createWriteStream(filepath)

        // Use the file stream directly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await pump(data.file, writeStream as any)

        // Remove old background file if exists
        const existingSetting = await db.setting.findUnique({
          where: { key: 'ui.backgroundImage' },
        })

        if (existingSetting?.value) {
          const oldPath = path.join(uploadsDir, existingSetting.value)
          try {
            await unlink(oldPath)
          } catch {
            // Ignore if file doesn't exist
          }
        }

        // Update database with new filename
        await db.setting.upsert({
          where: { key: 'ui.backgroundImage' },
          update: { value: filename },
          create: { key: 'ui.backgroundImage', value: filename },
        })

        return { success: true, filename }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        fastify.log.error('Error uploading background image: ' + errorMessage)
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'FST_REQ_FILE_TOO_LARGE'
        ) {
          return reply.status(400).send({ error: 'File too large. Maximum size is 5MB.' })
        }
        return reply.status(500).send({ error: 'Failed to upload image' })
      }
    }
  )

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
          requiresRestart: true,
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
