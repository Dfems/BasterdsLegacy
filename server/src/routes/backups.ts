import type { FastifyInstance, FastifyPluginCallback } from 'fastify'
import cron from 'node-cron'

import { CONFIG } from '../lib/config.js'
import { applyRetention, createBackup, listBackups, restoreBackup } from '../minecraft/backups.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  fastify.get(
    '/api/backups',
    {
      preHandler: fastify.authorize('viewer'),
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async () => listBackups()
  )

  fastify.post(
    '/api/backups',
    {
      preHandler: fastify.authorize('user'),
      config: { rateLimit: { max: 5, timeWindow: '10 minutes' } },
    },
    async (req, reply) => {
      const { mode } = (await req.body) as { mode?: 'full' | 'world' }
      if (!mode) return reply.status(400).send({ error: 'Invalid body' })
      const b = await createBackup(mode)
      try {
        await (
          await import('../lib/audit.js')
        ).auditLog({ type: 'backup', op: 'create', id: b.id, userId: req.user?.sub })
      } catch {}
      return b
    }
  )

  fastify.post(
    '/api/backups/:id/restore',
    {
      preHandler: fastify.authorize('user'),
      config: { rateLimit: { max: 2, timeWindow: '10 minutes' } },
    },
    async (req, reply) => {
      const id = (req.params as { id?: string }).id
      if (!id) return reply.status(400).send({ error: 'Missing id' })
      await restoreBackup(id)
      try {
        await (
          await import('../lib/audit.js')
        ).auditLog({ type: 'backup', op: 'restore', id, userId: req.user?.sub })
      } catch {}
      return { ok: true }
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
