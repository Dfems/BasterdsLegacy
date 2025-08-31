import type { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { processManager } from '../minecraft/process.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  fastify.post('/api/power', { preHandler: fastify.authorize('user') }, async (req, reply) => {
    const { action } = (await req.body) as { action?: 'start' | 'stop' | 'restart' }
    if (action === 'start') await processManager.start()
    else if (action === 'stop') await processManager.stop()
    else if (action === 'restart') await processManager.restart()
    else return reply.status(400).send({ error: 'Invalid action' })
    return { ok: true }
  })

  fastify.get('/api/status', async () => {
    return processManager.getStatus()
  })

  done()
}

export { plugin as powerRoutes }
