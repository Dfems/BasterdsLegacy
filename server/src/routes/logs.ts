import type { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { readLogs } from '../minecraft/logs.js'
import { processManager } from '../minecraft/process.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  fastify.get('/api/logs', { preHandler: fastify.authorize('viewer') }, async (req) => {
    const { cursor, limit } = req.query as { cursor?: string; limit?: string }
    const cur = cursor ? Number(cursor) : undefined
    const lim = limit ? Math.min(5000, Math.max(10, Number(limit))) : 1000
    return readLogs(cur, lim)
  })

  fastify.get('/api/logs/stream', { preHandler: fastify.authorize('viewer') }, async (req, res) => {
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
  })

  done()
}

export { plugin as logRoutes }
