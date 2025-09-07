import multipart from '@fastify/multipart'
import staticPlugin from '@fastify/static'
import type { FastifyInstance, FastifyPluginCallback } from 'fastify'
import { createWriteStream } from 'node:fs'
import { mkdir, unlink, access } from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'

import { CONFIG } from '../lib/config.js'
import { db } from '../lib/db.js'

const pump = promisify(pipeline)

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
      }
    }
  )

  done()
}

export { plugin as settingsRoutes }
