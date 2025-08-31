import type { FastifyInstance, FastifyPluginCallback } from 'fastify'
import type { RawData, WebSocket } from 'ws'

import { auditLog } from '../lib/audit.js'
import type { JwtPayload } from '../lib/auth.js'
import { processManager } from '../minecraft/process.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  fastify.get('/ws/console', { websocket: true }, async (socket: WebSocket, req) => {
    // Protezione JWT lato query: ?token=...
    try {
      const token = (req.query as Record<string, string | undefined>)?.token
      if (!token) {
        socket.close(1008, 'Token required')
        return
      }
      const payload = await fastify.jwt.verify<JwtPayload>(token)
      ;(req as any).user = payload
    } catch {
      socket.close(1008, 'Unauthorized')
      return
    }

    const onLog = (evt: unknown) => {
      const payload = JSON.stringify({ type: 'log', data: evt })
      socket.send(payload)
    }
    const onStatus = (evt: unknown) => {
      const payload = JSON.stringify({ type: 'status', data: evt })
      socket.send(payload)
    }
    processManager.on('log', onLog)
    processManager.on('status', onStatus)

    // semplice throttle locale
    let last = 0
    socket.on('message', async (raw: RawData) => {
      try {
        const msg = JSON.parse(String(raw)) as { type?: string; data?: string }
        if (msg.type === 'cmd' && typeof msg.data === 'string') {
          const now = Date.now()
          if (now - last < 100) return // throttle 10 msg/s
          last = now
          processManager.write(`${msg.data}\n`)
          const userId = ((req as any).user?.sub as string | undefined) ?? undefined
          await auditLog({ type: 'command', cmd: msg.data, userId: userId as string | undefined })
        }
      } catch {
        // ignore
      }
    })

    socket.on('close', () => {
      processManager.off('log', onLog)
      processManager.off('status', onStatus)
    })
  })
  done()
}

export { plugin as consoleRoutes }
