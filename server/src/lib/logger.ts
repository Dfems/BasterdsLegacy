const devTransport =
	process.env.NODE_ENV !== 'production'
		? {
				transport: {
					target: 'pino-pretty',
					options: { colorize: true, translateTime: 'SYS:standard' },
				},
			}
		: {}

export const loggerOptions = {
	level: process.env.LOG_LEVEL ?? 'info',
	...devTransport,
} as const
