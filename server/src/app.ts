import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import websocket from '@fastify/websocket'
import dotenv from 'dotenv'
import Fastify from 'fastify'
import { pathToFileURL } from 'node:url'

import { authPlugin } from './lib/auth.js'
import { CONFIG } from './lib/config.js'
import { checkJavaBin } from './lib/java.js'
import { initLogCleanup } from './lib/log-jobs.js'
import { loggerOptions } from './lib/logger.js'
import { requestLoggerPlugin } from './lib/request-logger.js'
import { initAutoBackup } from './minecraft/auto-backup.js'
import { authRoutes } from './routes/auth.js'
import { backupRoutes } from './routes/backups.js'
import { consoleRoutes } from './routes/console.js'
import { filesRoutes } from './routes/files.js'
import { healthRoutes } from './routes/health.js'
import { logRoutes } from './routes/logs.js'
import { modpackRoutes } from './routes/modpack.js'
import { powerRoutes } from './routes/power.js'
import { serverRoutes } from './routes/server.js'
import { settingsRoutes } from './routes/settings.js'
import { usersRoutes } from './routes/users.js'
import { whitelistRoutes } from './routes/whitelist.js'

// Carica variabili d'ambiente da .env (DATABASE_URL per Prisma, ecc.)
dotenv.config()

export const buildApp = () => {
  const app = Fastify({ logger: loggerOptions })

  app.register(cors)
  app.register(helmet)
  app.register(websocket)
  app.register(rateLimit, { max: 100, timeWindow: '1 minute' })
  app.register(jwt, { secret: CONFIG.JWT_SECRET, sign: { expiresIn: CONFIG.JWT_EXPIRES } })
  app.register(authPlugin)
  app.register(requestLoggerPlugin)
  app.register(authRoutes)
  // Cross-platform: valida JAVA_BIN (best-effort)
  checkJavaBin(app)
  app.register(healthRoutes)
  app.register(consoleRoutes)
  app.register(logRoutes)
  app.register(powerRoutes)
  app.register(whitelistRoutes)
  app.register(filesRoutes)
  app.register(backupRoutes)
  app.register(modpackRoutes)
  app.register(serverRoutes)
  app.register(settingsRoutes)
  app.register(usersRoutes)

  // Inizializza il sistema di backup automatico (asincrono)
  initAutoBackup().catch((error) => {
    app.log.error(error, 'Failed to initialize automatic backup system')
  })

  // Inizializza il sistema di pulizia log automatica
  initLogCleanup()

  return app
}

// Usa un confronto robusto tra URL del modulo ed argv (compatibile Windows)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = buildApp()

  app
    .listen({ port: CONFIG.PORT, host: '0.0.0.0' })
    .then(async (address) => {
      app.log.info(`Server listening at ${address}`)

      // Log evento di startup server
      try {
        const { auditLog } = await import('./lib/audit.js')
        await auditLog({
          type: 'server',
          op: 'startup',
          details: {
            address,
            port: CONFIG.PORT,
            environment: process.env.NODE_ENV || 'development',
          },
        })
      } catch (error) {
        app.log.warn({ error }, 'Failed to log server startup event')
      }
    })
    .catch((err) => {
      app.log.error(err)
      process.exit(1)
    })

  // Log evento di shutdown quando il processo termina
  const gracefulShutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down gracefully...`)

    try {
      const { auditLog } = await import('./lib/audit.js')
      await auditLog({
        type: 'server',
        op: 'shutdown',
        details: { signal },
      })
    } catch (error) {
      app.log.warn({ error }, 'Failed to log server shutdown event')
    }

    await app.close()
    process.exit(0)
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
}
