import fsp from 'node:fs/promises'
import path from 'node:path'

import { CONFIG } from '../lib/config.js'

export type ServerJarStatus = {
  hasJar: boolean
  jarType: 'vanilla' | 'fabric' | 'forge' | 'neoforge' | 'quilt' | 'custom' | null
  jarName: string | null
  canStart: boolean
}

// Lista dei file JAR comuni per i server
const COMMON_SERVER_JARS = [
  'server.jar',
  'minecraft_server.jar',
  'fabric-server-launch.jar',
  'forge-server.jar',
  'neoforge-server.jar',
  'quilt-server-launch.jar',
]

// Pattern per identificare il tipo di server dai nomi dei file
const JAR_TYPE_PATTERNS = [
  { pattern: /fabric.*server.*launch\.jar$/i, type: 'fabric' as const },
  { pattern: /fabric.*server.*\.jar$/i, type: 'fabric' as const },
  { pattern: /forge.*server.*\.jar$/i, type: 'forge' as const },
  { pattern: /neoforge.*server.*\.jar$/i, type: 'neoforge' as const },
  { pattern: /quilt.*server.*launch\.jar$/i, type: 'quilt' as const },
  { pattern: /quilt.*server.*\.jar$/i, type: 'quilt' as const },
  { pattern: /minecraft.*server.*\.jar$/i, type: 'vanilla' as const },
  { pattern: /server\.jar$/i, type: 'vanilla' as const },
]

export const checkServerJarStatus = async (): Promise<ServerJarStatus> => {
  try {
    // Verifica se la directory del server esiste
    await fsp.access(CONFIG.MC_DIR)

    // Legge tutti i file nella directory
    const files = await fsp.readdir(CONFIG.MC_DIR)

    // Cerca file JAR
    const jarFiles = files.filter((file) => file.endsWith('.jar'))

    if (jarFiles.length === 0) {
      return {
        hasJar: false,
        jarType: null,
        jarName: null,
        canStart: false,
      }
    }

    // Trova il JAR del server principale
    let serverJar: string | null = null
    let jarType: ServerJarStatus['jarType'] = 'custom'

    // Prima cerca i JAR comuni
    for (const commonJar of COMMON_SERVER_JARS) {
      if (jarFiles.includes(commonJar)) {
        serverJar = commonJar
        break
      }
    }

    // Se non trova JAR comuni, prende il primo disponibile
    if (!serverJar && jarFiles.length > 0) {
      serverJar = jarFiles[0] ?? null
    }

    // Determina il tipo di server dal nome del file
    if (serverJar) {
      for (const { pattern, type } of JAR_TYPE_PATTERNS) {
        if (pattern.test(serverJar)) {
          jarType = type
          break
        }
      }
    }

    return {
      hasJar: serverJar !== null,
      jarType,
      jarName: serverJar,
      canStart: serverJar !== null,
    }
  } catch (error) {
    // Se la directory non esiste o ci sono altri errori
    return {
      hasJar: false,
      jarType: null,
      jarName: null,
      canStart: false,
    }
  }
}
