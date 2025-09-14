import path from 'node:path'

const env = (key: string, fallback: string): string => (process.env[key] ?? fallback).toString()

// Configurazioni di base che non possono essere modificate dalla UI per sicurezza
const STATIC_CONFIG = {
  PORT: Number(env('PORT', '3000')),
  JWT_SECRET: env('JWT_SECRET', 'change_me'),
  JWT_EXPIRES: env('JWT_EXPIRES', '1h'),
} as const

// Configurazioni che possono essere override dal database
const DYNAMIC_CONFIG_DEFAULTS = {
  MC_DIR: path.resolve(env('MC_DIR', './server/runtime')),
  BACKUP_DIR: path.resolve(env('BACKUP_DIR', './server/runtime/backups')),
  JAVA_BIN: env('JAVA_BIN', 'java'),
  RCON_ENABLED: env('RCON_ENABLED', 'false') === 'true',
  RCON_HOST: env('RCON_HOST', '127.0.0.1'),
  RCON_PORT: Number(env('RCON_PORT', '25575')),
  RCON_PASS: env('RCON_PASS', ''),
  BACKUP_CRON: env('BACKUP_CRON', '0 3 * * *'),
  RETENTION_DAYS: Number(env('RETENTION_DAYS', '7')),
  RETENTION_WEEKS: Number(env('RETENTION_WEEKS', '4')),
  // Configurazione backup automatici
  AUTO_BACKUP_ENABLED: env('AUTO_BACKUP_ENABLED', 'false') === 'true',
  AUTO_BACKUP_CRON: env('AUTO_BACKUP_CRON', '0 3 * * *'),
  AUTO_BACKUP_MODE: env('AUTO_BACKUP_MODE', 'world') as 'full' | 'world',
  // Configurazione logging
  LOG_LEVEL: env('LOG_LEVEL', 'info') as 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal',
  LOG_LEVELS: env('LOG_LEVELS', 'info').split(',').map(level => level.trim()) as ('trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal')[],
  LOG_DIR: path.resolve(env('LOG_DIR', './logs')),
  LOG_FILE_ENABLED: env('LOG_FILE_ENABLED', 'true') === 'true',
  LOG_RETENTION_DAYS: Number(env('LOG_RETENTION_DAYS', '30')),
  LOG_MAX_FILES: Number(env('LOG_MAX_FILES', '10')),
  // Configurazioni per i pulsanti launcher e config
  LAUNCHER_BTN_VISIBLE: env('LAUNCHER_BTN_VISIBLE', 'true') === 'true',
  LAUNCHER_BTN_PATH: env('LAUNCHER_BTN_PATH', 'dfemscraft-launcher.jar'),
  CONFIG_BTN_VISIBLE: env('CONFIG_BTN_VISIBLE', 'true') === 'true',
  CONFIG_BTN_PATH: env('CONFIG_BTN_PATH', 'dfemscraft-config.zip'),
  // Configurazioni per modpack e versione corrente
  CURRENT_MODPACK: env('CURRENT_MODPACK', 'Basterd\'s Legacy'),
  CURRENT_VERSION: env('CURRENT_VERSION', '1.0.0'),
} as const

// Cache per le configurazioni del database
let dbConfigCache: Partial<typeof DYNAMIC_CONFIG_DEFAULTS> | null = null
let dbConfigCacheTime = 0
const CACHE_TTL = 60000 // 1 minuto

type ConfigType = typeof STATIC_CONFIG & typeof DYNAMIC_CONFIG_DEFAULTS

// Funzione per ottenere le configurazioni con override dal database
export const getConfig = async (): Promise<ConfigType> => {
  // Se abbiamo cache valida, usiamola
  if (dbConfigCache && Date.now() - dbConfigCacheTime < CACHE_TTL) {
    return { ...STATIC_CONFIG, ...DYNAMIC_CONFIG_DEFAULTS, ...dbConfigCache }
  }

  try {
    // Importazione dinamica per evitare dipendenze circolari
    const { db } = await import('./db.js')
    
    const settings = await db.setting.findMany({
      where: {
        key: {
          in: [
            'env.MC_DIR',
            'env.BACKUP_DIR', 
            'env.JAVA_BIN',
            'env.RCON_ENABLED',
            'env.RCON_HOST',
            'env.RCON_PORT',
            'env.RCON_PASS',
            'env.BACKUP_CRON',
            'env.RETENTION_DAYS',
            'env.RETENTION_WEEKS',
            'env.AUTO_BACKUP_ENABLED',
            'env.AUTO_BACKUP_CRON',
            'env.AUTO_BACKUP_MODE',
            'env.LOG_LEVEL',
            'env.LOG_LEVELS',
            'env.LOG_DIR',
            'env.LOG_FILE_ENABLED',
            'env.LOG_RETENTION_DAYS',
            'env.LOG_MAX_FILES',
            'env.LAUNCHER_BTN_VISIBLE',
            'env.LAUNCHER_BTN_PATH',
            'env.CONFIG_BTN_VISIBLE',
            'env.CONFIG_BTN_PATH',
            'env.CURRENT_MODPACK',
            'env.CURRENT_VERSION',
          ]
        }
      }
    })

    const overrides: Partial<typeof DYNAMIC_CONFIG_DEFAULTS> = {}
    
    for (const setting of settings) {
      const key = setting.key.replace('env.', '') as keyof typeof DYNAMIC_CONFIG_DEFAULTS
      const value = setting.value

      switch (key) {
        case 'MC_DIR':
        case 'BACKUP_DIR':
        case 'LOG_DIR':
          (overrides as Record<string, unknown>)[key] = path.resolve(value)
          break
        case 'JAVA_BIN':
        case 'RCON_HOST':
        case 'RCON_PASS':
        case 'BACKUP_CRON':
        case 'AUTO_BACKUP_CRON':
        case 'LOG_LEVEL':
        case 'LAUNCHER_BTN_PATH':
        case 'CONFIG_BTN_PATH':
        case 'CURRENT_MODPACK':
        case 'CURRENT_VERSION':
          (overrides as Record<string, unknown>)[key] = value
          break
        case 'LOG_LEVELS':
          (overrides as Record<string, unknown>)[key] = value.split(',').map((level: string) => level.trim())
          break
        case 'RCON_ENABLED':
        case 'LAUNCHER_BTN_VISIBLE':
        case 'CONFIG_BTN_VISIBLE':
        case 'AUTO_BACKUP_ENABLED':
        case 'LOG_FILE_ENABLED':
          (overrides as Record<string, unknown>)[key] = value === 'true'
          break
        case 'RCON_PORT':
        case 'RETENTION_DAYS':
        case 'RETENTION_WEEKS':
        case 'LOG_RETENTION_DAYS':
        case 'LOG_MAX_FILES':
          (overrides as Record<string, unknown>)[key] = Number(value)
          break
        case 'AUTO_BACKUP_MODE':
          (overrides as Record<string, unknown>)[key] = value as 'full' | 'world'
          break
      }
    }

    dbConfigCache = overrides
    dbConfigCacheTime = Date.now()
    
    return { ...STATIC_CONFIG, ...DYNAMIC_CONFIG_DEFAULTS, ...overrides }
  } catch (error) {
    // Se c'è un errore nel database, usa le configurazioni di default
    console.warn('Failed to load config from database, using defaults:', error)
    return { ...STATIC_CONFIG, ...DYNAMIC_CONFIG_DEFAULTS }
  }
}

// Configurazione sincrona per compatibilità con il codice esistente
export const CONFIG = { ...STATIC_CONFIG, ...DYNAMIC_CONFIG_DEFAULTS }

// Funzione per invalidare la cache (utile quando si aggiornano le configurazioni)
export const invalidateConfigCache = (): void => {
  dbConfigCache = null
  dbConfigCacheTime = 0
}

export type AppConfig = ConfigType
export type DynamicConfigKey = keyof typeof DYNAMIC_CONFIG_DEFAULTS
