import { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'

export type JwtPayload = {
	sub: string
	role?: 'owner' | 'user' | 'viewer'
}

declare module '@fastify/jwt' {
	// Augmenta i tipi JWT così che request.user sia tipizzato
	interface FastifyJWT {
		payload: JwtPayload
		user: JwtPayload
	}
}

declare module 'fastify' {
	interface FastifyInstance {
		authenticate: (request: FastifyRequest) => Promise<void>
		authorize: (role: 'owner' | 'user' | 'viewer') => (req: FastifyRequest, rep: FastifyReply) => Promise<void>
		issueToken: (userId: string, role: 'owner' | 'user' | 'viewer') => Promise<string>
	}
}

const authPlugin = fp(async (app: FastifyInstance) => {
	app.decorate('authenticate', async (request: FastifyRequest) => {
		// Lancerà 401 automaticamente se il token è invalido
		await request.jwtVerify<JwtPayload>()
	})

	app.decorate('authorize', function (role: 'owner' | 'user' | 'viewer') {
		return async (req: FastifyRequest, rep: FastifyReply) => {
			await req.jwtVerify<JwtPayload>()
			const user = req.user
			if (!user) return rep.status(401).send({ error: 'Unauthorized' })
			const levels: Record<'viewer' | 'user' | 'owner', number> = { viewer: 1, user: 2, owner: 3 }
			if (levels[(user.role ?? 'viewer')] < levels[role]) return rep.status(403).send({ error: 'Forbidden' })
		}
	})

	app.decorate('issueToken', async (userId: string, role: 'owner' | 'user' | 'viewer') => {
		return app.jwt.sign({ sub: userId, role })
	})
})

export { authPlugin }
