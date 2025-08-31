import bcrypt from 'bcrypt'
import type { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { auditLog } from '../lib/audit.js'
import { db } from '../lib/db.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  fastify.post('/api/auth/login', async (req, reply) => {
    const body = (await req.body) as { email?: string; password?: string }
    if (!body?.email || !body?.password) return reply.status(400).send({ error: 'Invalid body' })
    const user = await db.user.findUnique({ where: { email: body.email } })
    if (!user) return reply.status(401).send({ error: 'Invalid credentials' })
    const ok = await bcrypt.compare(body.password, user.passHash)
    if (!ok) return reply.status(401).send({ error: 'Invalid credentials' })
    const token = await fastify.issueToken(user.id, user.role)
    await auditLog({ type: 'login', userId: user.id })
    return { token, role: user.role, userId: user.id }
  })

  fastify.get('/api/auth/me', { preHandler: fastify.authenticate }, async (req) => {
    const u = req.user
    return { sub: u.sub, role: u.role }
  })

  done()
}

export { plugin as authRoutes }
