import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import websocket from '@fastify/websocket'
import Fastify from 'fastify'

import { authPlugin } from './lib/auth.js'
import { CONFIG } from './lib/config.js'
import { loggerOptions } from './lib/logger.js'
import { consoleRoutes } from './routes/console.js'
import { healthRoutes } from './routes/health.js'

export const buildApp = () => {
  const app = Fastify({ logger: loggerOptions })

  app.register(cors)
  app.register(helmet)
  app.register(websocket)
  app.register(jwt, { secret: CONFIG.JWT_SECRET })
  app.register(authPlugin)
  app.register(healthRoutes)
  app.register(consoleRoutes)

  return app
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = buildApp()
  app
    .listen({ port: CONFIG.PORT, host: '0.0.0.0' })
    .then((address) => {
      app.log.info(`Server listening at ${address}`)
    })
    .catch((err) => {
      app.log.error(err)
      process.exit(1)
    })
}
