import type { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { db } from '../lib/db.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  // Creazione utente: solo owner
  fastify.post('/api/users', { preHandler: fastify.authorize('owner') }, async (req, reply) => {
    const body = (await req.body) as {
      email?: string
      password?: string
      role?: 'user' | 'viewer'
    }
    const email = body?.email?.trim()
    const password = body?.password
    const role = body?.role ?? 'user'
    if (!email || !password) return reply.status(400).send({ error: 'Invalid body' })

    const exists = await db.user.findUnique({ where: { email } })
    if (exists) return reply.status(409).send({ error: 'Email already exists' })

    // Hash lato server già disponibile in seed-owner; riuso bcrypt qui
    const bcrypt = await import('bcrypt')
    const passHash = await bcrypt.hash(password, 10)

    const user = await db.user.create({ data: { email, passHash, role } })
    return { id: user.id, email: user.email, role: user.role }
  })

  done()
}

export { plugin as usersRoutes }
