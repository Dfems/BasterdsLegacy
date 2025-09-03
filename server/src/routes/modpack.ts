import type { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { installModpack, getSupportedVersions, type InstallRequest } from '../minecraft/modpack.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  // Endpoint per ottenere le versioni supportate
  fastify.get(
    '/api/modpack/versions',
    {
      preHandler: fastify.authorize('user'),
    },
    async (_req, reply) => {
      const versions = await getSupportedVersions()
      return { ok: true, versions }
    }
  )

  // Endpoint per installare modpack
  fastify.post(
    '/api/modpack/install',
    {
      preHandler: fastify.authorize('user'),
      config: { rateLimit: { max: 2, timeWindow: '10 minutes' } },
    },
    async (req, reply) => {
      const body = (await req.body) as Partial<InstallRequest>

      // Validazione per modalità automatica
      if (body.mode === 'automatic') {
        if (!body.loader || !body.mcVersion) {
          return reply
            .status(400)
            .send({ error: 'Loader e versione MC sono richiesti per modalità automatica' })
        }
      }
      // Validazione per modalità manuale
      else if (body.mode === 'manual') {
        if (!body.jarFileName) {
          return reply
            .status(400)
            .send({ error: 'Nome del file JAR è richiesto per modalità manuale' })
        }
      } else {
        return reply.status(400).send({ error: 'Modalità di installazione non specificata' })
      }

      const res = await installModpack(body as InstallRequest)
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
