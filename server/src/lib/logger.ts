import fs from 'node:fs'
import path from 'node:path'

import { CONFIG } from './config.js'

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
  
  return {
    transport: {
      targets: [
        // Console output per development
        ...(process.env.NODE_ENV !== 'production' ? [{
          target: 'pino-pretty',
          level: CONFIG.LOG_LEVEL,
          options: { 
            colorize: true, 
            translateTime: 'SYS:standard',
            destination: 1 // stdout
          },
        }] : []),
        // File output con rotazione
        {
          target: 'pino/file',
          level: CONFIG.LOG_LEVEL,
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
      level: CONFIG.LOG_LEVEL,
      ...devTransport,
    }
