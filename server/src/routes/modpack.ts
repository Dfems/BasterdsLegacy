import type { FastifyInstance, FastifyPluginCallback } from 'fastify'
import type { RawData, WebSocket } from 'ws'

import type { JwtPayload } from '../lib/auth.js'
import {
  installModpack,
  installModpackWithProgress,
  getSupportedVersions,
  type InstallRequest,
} from '../minecraft/modpack.js'

// Extended request type for user information
type ExtendedRequest = {
  user?: JwtPayload
}

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  // WebSocket per installazione modpack real-time
  fastify.get('/ws/modpack-install', { websocket: true }, async (socket: WebSocket, req) => {
    // Protezione JWT lato query: ?token=...
    try {
      const token = (req.query as Record<string, string | undefined>)?.token
      if (!token) {
        socket.close(1008, 'Token required')
        return
      }
      const payload = await fastify.jwt.verify<JwtPayload>(token)
      ;(req as ExtendedRequest).user = payload
    } catch {
      socket.close(1008, 'Unauthorized')
      return
    }

    // Ascolta per richieste di installazione
    socket.on('message', async (raw: RawData) => {
      try {
        const msg = JSON.parse(String(raw)) as { type?: string; data?: InstallRequest }
        if (msg.type === 'install' && msg.data) {
          // Installa con progresso real-time
          await installModpackWithProgress(msg.data, socket)
        }
      } catch (error) {
        socket.send(
          JSON.stringify({
            type: 'error',
            data: (error as Error).message,
          })
        )
      }
    })
  })

  // Endpoint per ottenere le versioni supportate
  fastify.get(
    '/api/modpack/versions',
    {
      preHandler: fastify.authorize('user'),
    },
    async (_req, _reply) => {
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
