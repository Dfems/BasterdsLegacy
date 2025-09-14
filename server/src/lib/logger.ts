import fs from 'node:fs'
import path from 'node:path'

import { CONFIG } from './config.js'

// Ordine dei log levels da meno verboso a più verboso
const LOG_LEVEL_PRIORITY = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
} as const

// Funzione per determinare il level minimo da un array di levels
const getMinimumLogLevel = (levels: string[]): string => {
  if (!levels || levels.length === 0) return 'info'
  
  // Se contiene 'all', usa 'trace' (il più verboso)
  if (levels.includes('all')) return 'trace'
  
  // Trova il level con priorità minima (più verboso)
  let minPriority = Infinity
  let minLevel = 'info'
  
  for (const level of levels) {
    if (level in LOG_LEVEL_PRIORITY) {
      const priority = LOG_LEVEL_PRIORITY[level as keyof typeof LOG_LEVEL_PRIORITY]
      if (priority < minPriority) {
        minPriority = priority
        minLevel = level
      }
    }
  }
  
  return minLevel
}

// Assicura che la directory dei log esista
const ensureLogDir = (logDir: string): void => {
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
  } catch (error) {
    console.warn(`Failed to create log directory ${logDir}:`, error)
  }
}

// Configurazione per il transport di sviluppo (console)
const devTransport =
  process.env.NODE_ENV !== 'production'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }
    : {}

// Configurazione per il transport su file (se abilitato)
const getFileTransport = () => {
  if (!CONFIG.LOG_FILE_ENABLED) return {}

  ensureLogDir(CONFIG.LOG_DIR)

  const logFile = path.join(CONFIG.LOG_DIR, 'app.log')
  
  // Determina il level minimo dai levels configurati
  const effectiveLevel = getMinimumLogLevel(CONFIG.LOG_LEVELS.length > 0 ? CONFIG.LOG_LEVELS : [CONFIG.LOG_LEVEL])
  
  return {
    transport: {
      targets: [
        // Console output per development
        ...(process.env.NODE_ENV !== 'production' ? [{
          target: 'pino-pretty',
          level: effectiveLevel,
          options: { 
            colorize: true, 
            translateTime: 'SYS:standard',
            destination: 1 // stdout
          },
        }] : []),
        // File output con rotazione
        {
          target: 'pino/file',
          level: effectiveLevel,
          options: { 
            destination: logFile,
            mkdir: true,
          },
        }
      ]
    }
  }
}

export const loggerOptions = CONFIG.LOG_FILE_ENABLED 
  ? getFileTransport()
  : {
      level: getMinimumLogLevel(CONFIG.LOG_LEVELS.length > 0 ? CONFIG.LOG_LEVELS : [CONFIG.LOG_LEVEL]),
      ...devTransport,
    }
