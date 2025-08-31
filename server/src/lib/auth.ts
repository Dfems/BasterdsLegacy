import { type FastifyInstance, type FastifyRequest } from 'fastify'
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
	}
}

const authPlugin = fp(async (app: FastifyInstance) => {
	app.decorate('authenticate', async (request: FastifyRequest) => {
		// Lancerà 401 automaticamente se il token è invalido
		await request.jwtVerify<JwtPayload>()
	})
})

export { authPlugin }
