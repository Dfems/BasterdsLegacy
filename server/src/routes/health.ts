import { type FastifyInstance, type FastifyPluginCallback } from 'fastify'

type HealthResponse = {
  status: 'ok'
  uptime: number
  timestamp: string
}

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  fastify.get('/api/health', async (_req, _reply) => {
    const body: HealthResponse = {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }
    return body
  })
  done()
}

export { plugin as healthRoutes }
