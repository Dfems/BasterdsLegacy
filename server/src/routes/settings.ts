import multipart from '@fastify/multipart'
import staticPlugin from '@fastify/static'
import type { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { createWriteStream } from 'node:fs'
import { mkdir, unlink, access } from 'node:fs/promises'
import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'

import { CONFIG } from '../lib/config.js'
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
    async (req, reply) => {
      const body = (await req.body) as { backgroundImage?: string | null }

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
