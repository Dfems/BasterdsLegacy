import type { FastifyInstance, FastifyPluginCallback } from 'fastify'
import fs from 'node:fs'
import path from 'node:path'

import { CONFIG } from '../lib/config.js'
import { getLogStats, cleanupOldLogs as _cleanupOldLogs } from '../lib/log-cleanup.js'
import { manualLogCleanup } from '../lib/log-jobs.js'
import { readLogs } from '../minecraft/logs.js'
import { processManager } from '../minecraft/process.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  fastify.get(
    '/api/logs',
    {
      preHandler: fastify.authorize('viewer'),
      config: { rateLimit: { max: 120, timeWindow: '1 minute' } },
    },
    async (req) => {
      const { cursor, limit } = req.query as { cursor?: string; limit?: string }
      const cur = cursor ? Number(cursor) : undefined
      const lim = limit ? Math.min(5000, Math.max(10, Number(limit))) : 1000
      return readLogs(cur, lim)
    }
  )

  // Nuova API per i log di sistema/applicazione
  fastify.get(
    '/api/logs/system',
    {
      preHandler: fastify.authorize('viewer'),
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      try {
        const { lines } = req.query as { lines?: string }
        const maxLines = lines ? Math.min(10000, Math.max(10, Number(lines))) : 1000

        const logFile = path.join(CONFIG.LOG_DIR, 'app.log')

        if (!fs.existsSync(logFile)) {
          return { logs: [], total: 0, message: 'No system logs available' }
        }

        const content = fs.readFileSync(logFile, 'utf-8')
        const allLines = content
          .trim()
          .split('\n')
          .filter((line) => line.length > 0)
        const requestedLines = allLines.slice(-maxLines)

        // Parse JSON logs and make them human readable
        const parsedLogs = requestedLines.map((line, index) => {
          try {
            const logEntry = JSON.parse(line)
            const timestamp = new Date(logEntry.time).toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })

            const levelNames = {
              10: 'TRACE',
              20: 'DEBUG',
              30: 'INFO',
              40: 'WARN',
              50: 'ERROR',
              60: 'FATAL',
            }

            return {
              id: allLines.length - maxLines + index,
              timestamp,
              level: levelNames[logEntry.level as keyof typeof levelNames] || 'UNKNOWN',
              message: logEntry.msg || 'No message',
              details: {
                pid: logEntry.pid,
                hostname: logEntry.hostname,
                ...Object.fromEntries(
                  Object.entries(logEntry).filter(
                    ([key]) => !['level', 'time', 'pid', 'hostname', 'msg'].includes(key)
                  )
                ),
              },
            }
          } catch {
            // Se non è JSON valido, ritorna la riga così com'è
            return {
              id: allLines.length - maxLines + index,
              timestamp: 'Unknown',
              level: 'RAW',
              message: line,
              details: {},
            }
          }
        })

        return {
          logs: parsedLogs,
          total: allLines.length,
          showing: parsedLogs.length,
          logFile: path.basename(logFile),
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        fastify.log.error({ error: errorMsg }, 'Failed to read system logs')
        return reply.status(500).send({ error: 'Failed to read system logs' })
      }
    }
  )

  // API per statistiche sui log
  fastify.get(
    '/api/logs/stats',
    {
      preHandler: fastify.authorize('viewer'),
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async () => {
      try {
        const stats = getLogStats(CONFIG.LOG_DIR)
        return {
          ...stats,
          totalSizeFormatted: `${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`,
          logDir: CONFIG.LOG_DIR,
          retentionDays: CONFIG.LOG_RETENTION_DAYS,
          maxFiles: CONFIG.LOG_MAX_FILES,
          logFileEnabled: CONFIG.LOG_FILE_ENABLED,
          logLevel: CONFIG.LOG_LEVEL,
          logLevels: CONFIG.LOG_LEVELS,
          files: stats.files.map((file) => ({
            ...file,
            sizeFormatted: `${(file.size / 1024).toFixed(1)} KB`,
            modifiedFormatted: file.modified.toLocaleString('en-US'),
          })),
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('Failed to get log stats:', errorMsg)
        return { error: 'Failed to get log statistics' }
      }
    }
  )

  // API per pulizia manuale dei log (solo admin)
  fastify.post(
    '/api/logs/cleanup',
    {
      preHandler: fastify.authorize('user'),
      config: { rateLimit: { max: 5, timeWindow: '10 minutes' } },
    },
    async (req, reply) => {
      try {
        await manualLogCleanup()

        // Log dell'azione
        try {
          await (
            await import('../lib/audit.js')
          ).auditLog({
            type: 'job',
            name: 'manual-log-cleanup',
            op: 'start',
            details: { triggeredBy: req.user?.sub },
          })
        } catch {
          console.warn('Failed to log manual cleanup audit')
        }

        return { ok: true, message: 'Log cleanup completed' }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        fastify.log.error({ error: errorMsg }, 'Manual log cleanup failed')
        return reply.status(500).send({ error: 'Log cleanup failed' })
      }
    }
  )

  fastify.get(
    '/api/logs/stream',
    {
      preHandler: fastify.authorize('viewer'),
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (req, res) => {
      res.raw.setHeader('Content-Type', 'text/event-stream')
      res.raw.setHeader('Cache-Control', 'no-cache')
      res.raw.setHeader('Connection', 'keep-alive')
      res.raw.flushHeaders?.()

      const send = (event: string, data: unknown) => {
        res.raw.write(`event: ${event}\n`)
        res.raw.write(`data: ${JSON.stringify(data)}\n\n`)
      }

      const onLog = (evt: unknown) => send('log', evt)
      const onStatus = (evt: unknown) => send('status', evt)

      processManager.on('log', onLog)
      processManager.on('status', onStatus)

      req.raw.on('close', () => {
        processManager.off('log', onLog)
        processManager.off('status', onStatus)
        res.raw.end()
      })
    }
  )

  done()
}

export { plugin as logRoutes }
