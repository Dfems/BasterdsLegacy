import type { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { CONFIG } from '../lib/config.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  fastify.get('/api/settings', { preHandler: fastify.authorize('viewer') }, async () => {
    return {
      javaBin: CONFIG.JAVA_BIN,
      mcDir: CONFIG.MC_DIR,
      backupDir: CONFIG.BACKUP_DIR,
      rcon: { enabled: CONFIG.RCON_ENABLED, host: CONFIG.RCON_HOST, port: CONFIG.RCON_PORT },
      backupCron: CONFIG.BACKUP_CRON,
      retentionDays: CONFIG.RETENTION_DAYS,
      retentionWeeks: CONFIG.RETENTION_WEEKS,
    }
  })
  done()
}

export { plugin as settingsRoutes }
