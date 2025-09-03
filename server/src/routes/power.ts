import type { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { processManager } from '../minecraft/process.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  fastify.post(
    '/api/power',
    {
      preHandler: fastify.authorize('user'),
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const { action } = (await req.body) as { action?: 'start' | 'stop' | 'restart' }
      if (action === 'start') await processManager.start()
      else if (action === 'stop') await processManager.stop()
      else if (action === 'restart') await processManager.restart()
      else return reply.status(400).send({ error: 'Invalid action' })
      try {
        await (
          await import('../lib/audit.js')
        ).auditLog({ type: 'power', op: action, userId: req.user?.sub })
      } catch {}
      return { ok: true }
    }
  )

  fastify.get('/api/status', async () => {
    return processManager.getStatus()
  })

  done()
}

export { plugin as powerRoutes }
