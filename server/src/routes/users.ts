import type { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { db } from '../lib/db.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  // Creazione utente: solo owner
  fastify.post('/api/users', { preHandler: fastify.authorize('owner') }, async (req, reply) => {
    try {
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

      // Log dell'evento di creazione utente
      try {
        await (
          await import('../lib/audit.js')
        ).auditLog({
          type: 'user',
          op: 'create',
          targetUserId: user.id,
          userId: req.user?.sub,
          details: { email: user.email, role: user.role },
        })
      } catch {
        console.warn('Failed to log user creation audit')
      }

      return { id: user.id, email: user.email, role: user.role }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'

      // Log dell'errore
      try {
        await (
          await import('../lib/audit.js')
        ).auditLog({
          type: 'user',
          op: 'create',
          userId: req.user?.sub,
          details: {
            error: errorMsg,
            attempted_email: (req.body as { email?: string })?.email,
          },
        })
      } catch {
        console.warn('Failed to log user creation error audit')
      }

      console.error('User creation failed:', errorMsg)
      return reply.status(500).send({ error: 'Failed to create user' })
    }
  })

  done()
}

export { plugin as usersRoutes }
