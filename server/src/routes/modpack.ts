import type { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { installModpack, type InstallRequest } from '../minecraft/modpack.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  fastify.post(
    '/api/modpack/install',
    {
      preHandler: fastify.authorize('user'),
      config: { rateLimit: { max: 2, timeWindow: '10 minutes' } },
    },
    async (req, reply) => {
      const body = (await req.body) as Partial<InstallRequest>
      if (!body.loader || !body.mcVersion) return reply.status(400).send({ error: 'Invalid body' })
      const res = await installModpack({
        loader: body.loader,
        mcVersion: body.mcVersion,
        manifest: body.manifest,
      })
      try {
        await (
          await import('../lib/audit.js')
        ).auditLog({
          type: 'command',
          cmd: `modpack install ${body.loader} ${body.mcVersion}`,
          userId: req.user?.sub,
        })
      } catch {}
      return res
    }
  )
  done()
}

export { plugin as modpackRoutes }
