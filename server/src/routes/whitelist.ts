import type { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { listWhitelist, updateWhitelist, type WhitelistAction } from '../minecraft/whitelist.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  fastify.get('/api/whitelist', { preHandler: fastify.authorize('viewer') }, async () => {
    const players = await listWhitelist()
    return { players }
  })

  fastify.post('/api/whitelist', { preHandler: fastify.authorize('user') }, async (req, reply) => {
    const body = (await req.body) as { action?: WhitelistAction; player?: string }
    if (!body?.action || !body?.player) return reply.status(400).send({ error: 'Invalid body' })
    await updateWhitelist(body.action, body.player)
    return { ok: true }
  })

  done()
}

export { plugin as whitelistRoutes }
