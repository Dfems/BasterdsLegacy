import type { FastifyInstance, FastifyPluginCallback } from 'fastify'
import cron from 'node-cron'

import { CONFIG } from '../lib/config.js'
import {
  getCurrentSchedule,
  updateScheduler,
  validateScheduleConfig,
  BACKUP_PRESETS,
  type BackupScheduleConfig,
} from '../minecraft/auto-backup.js'
import { applyRetention, createBackup, listBackups, restoreBackup } from '../minecraft/backups.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  fastify.get(
    '/api/backups',
    {
      preHandler: fastify.authorize('viewer'),
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      try {
        return await listBackups()
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('Failed to list backups:', errorMsg)
        return reply.status(500).send({ error: 'Failed to list backups' })
      }
    }
  )

  fastify.post(
    '/api/backups',
    {
      preHandler: fastify.authorize('user'),
      config: { rateLimit: { max: 5, timeWindow: '10 minutes' } },
    },
    async (req, reply) => {
      try {
        const { mode } = (await req.body) as { mode?: 'full' | 'world' }

        // Validazione input
        if (!mode || (mode !== 'full' && mode !== 'world')) {
          return reply.status(400).send({ error: 'Invalid mode. Must be "full" or "world"' })
        }

        const b = await createBackup(mode)

        try {
          await (
            await import('../lib/audit.js')
          ).auditLog({ type: 'backup', op: 'create', id: b.id, userId: req.user?.sub })
        } catch {
          // Log audit error but don't fail the request
          console.warn('Failed to log backup creation audit')
        }

        return b
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'

        // Log dell'errore con audit
        try {
          await (
            await import('../lib/audit.js')
          ).auditLog({
            type: 'backup',
            op: 'create',
            userId: req.user?.sub,
            details: {
              error: errorMsg,
              mode: (req.body as { mode?: string })?.mode,
            },
          })
        } catch {
          console.warn('Failed to log backup error audit')
        }

        console.error('Backup creation failed:', errorMsg)
        return reply.status(500).send({ error: errorMsg })
      }
    }
  )

  fastify.post(
    '/api/backups/:id/restore',
    {
      preHandler: fastify.authorize('user'),
      config: { rateLimit: { max: 2, timeWindow: '10 minutes' } },
    },
    async (req, reply) => {
      try {
        const id = (req.params as { id?: string }).id

        // Validazione input
        if (!id || typeof id !== 'string') {
          return reply.status(400).send({ error: 'Missing or invalid backup ID' })
        }

        await restoreBackup(id)

        try {
          await (
            await import('../lib/audit.js')
          ).auditLog({ type: 'backup', op: 'restore', id, userId: req.user?.sub })
        } catch {
          // Log audit error but don't fail the request
          console.warn('Failed to log backup restore audit')
        }

        return { ok: true }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'

        // Log dell'errore con audit
        try {
          await (
            await import('../lib/audit.js')
          ).auditLog({
            type: 'backup',
            op: 'restore',
            id: (req.params as { id?: string }).id,
            userId: req.user?.sub,
            details: { error: errorMsg },
          })
        } catch {
          console.warn('Failed to log backup restore error audit')
        }

        console.error('Backup restore failed:', errorMsg)
        return reply.status(500).send({ error: errorMsg })
      }
    }
  )

  // GET /api/backups/schedule - Ottiene configurazione backup automatico
  fastify.get(
    '/api/backups/schedule',
    {
      preHandler: fastify.authorize('viewer'),
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    async (_req, reply) => {
      try {
        const schedule = await getCurrentSchedule()
        return {
          config: schedule,
          presets: Object.keys(BACKUP_PRESETS),
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('Failed to get backup schedule:', errorMsg)
        return reply.status(500).send({ error: 'Failed to get backup schedule' })
      }
    }
  )

  // PUT /api/backups/schedule - Aggiorna configurazione backup automatico
  fastify.put(
    '/api/backups/schedule',
    {
      preHandler: fastify.authorize('user'),
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      try {
        const body = (await req.body) as Record<string, unknown>

        // Supporta preset predefiniti
        if (body.preset && typeof body.preset === 'string') {
          const preset = BACKUP_PRESETS[body.preset as keyof typeof BACKUP_PRESETS]
          if (!preset) {
            return reply.status(400).send({
              error: `Invalid preset. Available presets: ${Object.keys(BACKUP_PRESETS).join(', ')}`,
            })
          }

          // Applica preset
          await updateScheduler(preset as BackupScheduleConfig)

          try {
            await (
              await import('../lib/audit.js')
            ).auditLog({
              type: 'backup',
              op: 'schedule_update',
              details: { preset: body.preset },
              userId: req.user?.sub,
            })
          } catch {
            console.warn('Failed to log backup schedule update audit')
          }

          return { ok: true, config: await getCurrentSchedule() }
        }

        // Validazione configurazione custom
        const validation = validateScheduleConfig(body)
        if (!validation.valid) {
          return reply.status(400).send({
            error: 'Invalid configuration',
            details: validation.errors,
          })
        }

        // Applica configurazione custom
        await updateScheduler(body as BackupScheduleConfig)

        try {
          await (
            await import('../lib/audit.js')
          ).auditLog({
            type: 'backup',
            op: 'schedule_update',
            details: { custom: true },
            userId: req.user?.sub,
          })
        } catch {
          console.warn('Failed to log backup schedule update audit')
        }

        return { ok: true, config: await getCurrentSchedule() }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('Failed to update backup schedule:', errorMsg)
        return reply.status(500).send({ error: errorMsg })
      }
    }
  )

  // GET /api/backups/presets - Lista preset disponibili
  fastify.get(
    '/api/backups/presets',
    {
      preHandler: fastify.authorize('viewer'),
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    async (_req, reply) => {
      try {
        return {
          presets: Object.entries(BACKUP_PRESETS).map(([key, config]) => ({
            id: key,
            name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            ...config,
          })),
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('Failed to get backup presets:', errorMsg)
        return reply.status(500).send({ error: 'Failed to get backup presets' })
      }
    }
  )

  // scheduler retention
  try {
    cron.schedule(CONFIG.BACKUP_CRON, async () => {
      await applyRetention()
    })
  } catch {
    // ignore cron setup errors
  }

  done()
}

export { plugin as backupRoutes }
