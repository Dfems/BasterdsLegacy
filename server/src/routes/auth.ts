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

  // Seed iniziale: crea owner se non esiste alcun utente
  fastify.post('/api/auth/seed-owner', async (req, reply) => {
    const { email, password } = (await req.body) as { email?: string; password?: string }
    if (!email || !password) return reply.status(400).send({ error: 'Invalid body' })
    const users = await db.user.count()
    if (users > 0) {
      // consentito solo a owner successivamente
      try {
        await fastify.authorize('owner')(req, reply)
      } catch {
        return // risposta già inviata in authorize
      }
    }
    const exists = await db.user.findUnique({ where: { email } })
    if (exists) return reply.status(409).send({ error: 'Email already exists' })
    const passHash = await bcrypt.hash(password, 10)
    const user = await db.user.create({ data: { email, passHash, role: 'owner' } })
    const token = await fastify.issueToken(user.id, user.role)
    return { token, role: user.role, userId: user.id }
  })

  done()
}

export { plugin as authRoutes }
