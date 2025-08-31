import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import websocket from '@fastify/websocket'
import Fastify from 'fastify'

import { authPlugin } from './lib/auth.js'
import { CONFIG } from './lib/config.js'
import { loggerOptions } from './lib/logger.js'
import { authRoutes } from './routes/auth.js'
import { backupRoutes } from './routes/backups.js'
import { consoleRoutes } from './routes/console.js'
import { filesRoutes } from './routes/files.js'
import { healthRoutes } from './routes/health.js'
import { logRoutes } from './routes/logs.js'
import { modpackRoutes } from './routes/modpack.js'
import { powerRoutes } from './routes/power.js'
import { serverRoutes } from './routes/server.js'
import { whitelistRoutes } from './routes/whitelist.js'

export const buildApp = () => {
  const app = Fastify({ logger: loggerOptions })

  app.register(cors)
  app.register(helmet)
  app.register(websocket)
  app.register(rateLimit, { max: 100, timeWindow: '1 minute' })
  app.register(jwt, { secret: CONFIG.JWT_SECRET })
  app.register(authPlugin)
  app.register(authRoutes)
  app.register(healthRoutes)
  app.register(consoleRoutes)
  app.register(logRoutes)
  app.register(powerRoutes)
  app.register(whitelistRoutes)
  app.register(filesRoutes)
  app.register(backupRoutes)
  app.register(modpackRoutes)
  app.register(serverRoutes)

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
