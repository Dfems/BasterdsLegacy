import type { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { installModpack, type InstallRequest } from '../minecraft/modpack.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  fastify.post(
    '/api/modpack/install',
    { preHandler: fastify.authorize('user') },
    async (req, reply) => {
      const body = (await req.body) as Partial<InstallRequest>
      if (!body.loader || !body.mcVersion) return reply.status(400).send({ error: 'Invalid body' })
      return installModpack({
        loader: body.loader,
        mcVersion: body.mcVersion,
        manifest: body.manifest,
      })
    }
  )
  done()
}

export { plugin as modpackRoutes }
