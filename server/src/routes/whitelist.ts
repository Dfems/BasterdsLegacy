import type { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { listWhitelist, updateWhitelist, type WhitelistAction } from '../minecraft/whitelist.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  fastify.get(
    '/api/whitelist',
    {
      preHandler: fastify.authorize('viewer'),
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async () => {
      const players = await listWhitelist()
      return { players }
    }
  )

  fastify.post(
    '/api/whitelist',
    {
      preHandler: fastify.authorize('user'),
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const body = (await req.body) as { action?: WhitelistAction; player?: string }
      if (!body?.action || !body?.player) return reply.status(400).send({ error: 'Invalid body' })
      await updateWhitelist(body.action, body.player)
      try {
        await (
          await import('../lib/audit.js')
        ).auditLog({
          type: 'command',
          cmd: `whitelist ${body.action} ${body.player}`,
          userId: req.user?.sub,
        })
      } catch {}
      return { ok: true }
    }
  )

  done()
}

export { plugin as whitelistRoutes }
