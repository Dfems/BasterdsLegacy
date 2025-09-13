import type { FastifyInstance, FastifyPluginCallback, FastifyRequest } from 'fastify'

// Estrae l'user ID dalla richiesta se presente
const getUserId = (request: FastifyRequest): string | null => {
  try {
    // Se l'utente è autenticato, avrà il campo user nel request
    if ('user' in request && request.user && typeof request.user === 'object' && 'sub' in request.user) {
      return request.user.sub as string
    }
  } catch {
    // Ignora errori di parsing
  }
  return null
}

// Formatta la durata in modo leggibile
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  return `${(ms / 60000).toFixed(2)}min`
}

// Determina se la richiesta è un'operazione significativa che dovrebbe essere loggata
const shouldLogRequest = (url: string, method: string): boolean => {
  // Non loggare richieste di health check, websocket, asset statici
  if (url.includes('/health') || url.includes('/ws') || url.startsWith('/static/')) {
    return false
  }
  
  // Logga tutte le operazioni API
  if (url.startsWith('/api/')) {
    return true
  }
  
  return false
}

export const requestLoggerPlugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  // Hook per loggare l'inizio delle richieste
  fastify.addHook('onRequest', async (request, reply) => {
    const startTime = Date.now()
    
    // Salva il tempo di inizio nel request per calcolare la durata dopo
    ;(request as unknown as Record<string, unknown>).startTime = startTime
    
    if (shouldLogRequest(request.url, request.method)) {
      const userId = getUserId(request)
      
      fastify.log.info({
        type: 'api_request_start',
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        userId: userId || undefined,
        timestamp: new Date().toISOString(),
      }, `API Request started: ${request.method} ${request.url}${userId ? ` (User: ${userId})` : ''}`)
    }
  })
  
  // Hook per loggare la fine delle richieste
  fastify.addHook('onResponse', async (request, reply) => {
    if (!shouldLogRequest(request.url, request.method)) {
      return
    }
    
    const startTime = (request as unknown as Record<string, unknown>).startTime as number
    const duration = Date.now() - startTime
    const userId = getUserId(request)
    
    const logData = {
      type: 'api_request_end',
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
      durationMs: duration,
      ip: request.ip,
      userId: userId || undefined,
      timestamp: new Date().toISOString(),
    }
    
    const message = `API Request completed: ${request.method} ${request.url} - Status: ${reply.statusCode} - Duration: ${formatDuration(duration)}${userId ? ` (User: ${userId})` : ''}`
    
    // Log con livello appropriato basato sul status code
    if (reply.statusCode >= 500) {
      fastify.log.error(logData, message)
    } else if (reply.statusCode >= 400) {
      fastify.log.warn(logData, message)
    } else {
      fastify.log.info(logData, message)
    }
  })
  
  // Hook per loggare errori non gestiti
  fastify.addHook('onError', async (request, reply, error) => {
    const userId = getUserId(request)
    const startTime = (request as unknown as Record<string, unknown>).startTime as number || Date.now()
    const duration = Date.now() - startTime
    
    fastify.log.error({
      type: 'api_error',
      method: request.method,
      url: request.url,
      error: error.message,
      errorCode: error.code,
      statusCode: reply.statusCode || 500,
      duration: `${duration}ms`,
      durationMs: duration,
      ip: request.ip,
      userId: userId || undefined,
      timestamp: new Date().toISOString(),
      stack: error.stack,
    }, `API Error: ${request.method} ${request.url} - ${error.message}${userId ? ` (User: ${userId})` : ''}`)
  })
  
  done()
}