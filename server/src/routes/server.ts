import type { FastifyInstance, FastifyPluginCallback } from 'fastify'
import fse from 'fs-extra'
import path from 'node:path'

import { CONFIG } from '../lib/config.js'
import { loadInstallationInfo } from '../minecraft/modpack.js'
import { processManager } from '../minecraft/process.js'
import { checkServerJarStatus } from '../minecraft/serverJar.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  // Nuovo endpoint per verificare stato JAR del server
  fastify.get(
    '/api/server/jar-status',
    {
      preHandler: fastify.authorize('user'),
    },
    async () => {
      const installationInfo = await loadInstallationInfo()
      return await checkServerJarStatus(installationInfo || undefined)
    }
  )

  fastify.delete(
    '/api/server',
    {
      preHandler: fastify.authorize('owner'),
      config: { rateLimit: { max: 1, timeWindow: '1 hour' } },
    },
    async (req) => {
      // stop processo e sposta MC_DIR in quarantine
      await processManager.stop()
      const quarantine = path.join(path.dirname(CONFIG.MC_DIR), 'quarantine')
      const dest = path.join(quarantine, String(Date.now()))
      await fse.mkdirp(quarantine)
      await fse.move(CONFIG.MC_DIR, dest, { overwrite: false })
      try {
        await (
          await import('../lib/audit.js')
        ).auditLog({ type: 'command', cmd: 'server delete', userId: req.user?.sub })
      } catch {}
      return { movedTo: dest }
    }
  )

  // purge semplice a intervalli (ogni ora)
  const PURGE_MS = 48 * 60 * 60 * 1000
  const timer = setInterval(
    async () => {
      const quarantine = path.join(path.dirname(CONFIG.MC_DIR), 'quarantine')
      try {
        const items = await fse.readdir(quarantine)
        const now = Date.now()
        for (const name of items) {
          const full = path.join(quarantine, name)
          const stat = await fse.stat(full)
          if (now - stat.mtimeMs > PURGE_MS) await fse.remove(full)
        }
      } catch {
        // ignore
      }
    },
    60 * 60 * 1000
  )
  fastify.addHook('onClose', async () => clearInterval(timer))

  done()
}

export { plugin as serverRoutes }
