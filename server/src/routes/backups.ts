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
        console.error('Backup restore failed:', errorMsg)
        return reply.status(500).send({ error: errorMsg })
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
