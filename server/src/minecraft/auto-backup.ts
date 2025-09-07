import cron from 'node-cron'

import { CONFIG } from '../lib/config.js'
import { createBackup, applyRetention } from './backups.js'

// Tipi per la configurazione del backup automatico
export type BackupFrequency = 
  | 'disabled'
  | 'daily'
  | 'every-2-days' 
  | 'every-3-days'
  | 'weekly'
  | 'custom'

export type BackupScheduleConfig = {
  enabled: boolean
  frequency: BackupFrequency
  mode: 'full' | 'world'
  cronPattern?: string // Usato quando frequency è 'custom'
  // Preset per facilità d'uso
  dailyAt?: string // HH:MM formato, es. "03:00"
  weeklyOn?: number // 0=domenica, 1=lunedì, etc.
  multipleDaily?: string[] // Array di orari es. ["08:00", "14:00", "20:00"]
}

// Configurazione default
const DEFAULT_SCHEDULE: BackupScheduleConfig = {
  enabled: CONFIG.AUTO_BACKUP_ENABLED,
  frequency: CONFIG.AUTO_BACKUP_ENABLED ? 'daily' : 'disabled',
  mode: CONFIG.AUTO_BACKUP_MODE,
  dailyAt: '03:00',
}

// Stato globale della configurazione
let currentSchedule: BackupScheduleConfig = { ...DEFAULT_SCHEDULE }
let currentTask: cron.ScheduledTask | null = null

// Preset predefiniti per facilità d'uso
export const BACKUP_PRESETS = {
  disabled: { enabled: false, frequency: 'disabled' as const },
  daily_3am: { enabled: true, frequency: 'daily' as const, mode: 'world' as const, dailyAt: '03:00' },
  daily_2am: { enabled: true, frequency: 'daily' as const, mode: 'world' as const, dailyAt: '02:00' },
  every_2_days: { enabled: true, frequency: 'every-2-days' as const, mode: 'world' as const, dailyAt: '03:00' },
  every_3_days: { enabled: true, frequency: 'every-3-days' as const, mode: 'world' as const, dailyAt: '03:00' },
  weekly_monday: { enabled: true, frequency: 'weekly' as const, mode: 'full' as const, weeklyOn: 1, dailyAt: '03:00' },
  weekly_sunday: { enabled: true, frequency: 'weekly' as const, mode: 'full' as const, weeklyOn: 0, dailyAt: '03:00' },
  triple_daily: { enabled: true, frequency: 'custom' as const, mode: 'world' as const, multipleDaily: ['08:00', '14:00', '20:00'] },
} as const

// Converte la configurazione in pattern cron
export const configToCronPattern = (config: BackupScheduleConfig): string | null => {
  if (!config.enabled || config.frequency === 'disabled') {
    return null
  }

  // Pattern cron custom fornito direttamente
  if (config.frequency === 'custom' && config.cronPattern) {
    return config.cronPattern
  }

  // Multiple backup giornalieri
  if (config.frequency === 'custom' && config.multipleDaily?.length) {
    // Returna il primo, poi gestiremo multipli separatamente
    const [hour, minute] = (config.multipleDaily[0] ?? '03:00').split(':').map(Number)
    return `${minute ?? 0} ${hour ?? 3} * * *`
  }

  const [hour, minute] = (config.dailyAt ?? '03:00').split(':').map(Number)

  switch (config.frequency) {
    case 'daily':
      return `${minute ?? 0} ${hour ?? 3} * * *`
    case 'every-2-days':
      return `${minute ?? 0} ${hour ?? 3} */2 * *`
    case 'every-3-days':
      return `${minute ?? 0} ${hour ?? 3} */3 * *`
    case 'weekly':
      const dayOfWeek = config.weeklyOn ?? 1 // Default lunedì
      return `${minute ?? 0} ${hour ?? 3} * * ${dayOfWeek}`
    default:
      return null
  }
}

// Esegue il backup automatico
const executeAutoBackup = async (): Promise<void> => {
  try {
    console.log(`Starting automatic backup (mode: ${currentSchedule.mode})...`)
    
    const backup = await createBackup(currentSchedule.mode)
    
    console.log(`Automatic backup completed successfully: ${backup.id} (${(backup.size / 1024 / 1024).toFixed(2)} MB)`)
    
    // Applica retention policy dopo ogni backup automatico
    try {
      await applyRetention()
      console.log('Retention policy applied successfully')
    } catch (retentionError) {
      console.warn('Failed to apply retention policy:', retentionError instanceof Error ? retentionError.message : retentionError)
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Automatic backup failed:', errorMsg)
    // Non rilanciamo l'errore per non interrompere il scheduler
  }
}

// Avvia/ferma i task cron
export const updateScheduler = (config: BackupScheduleConfig): void => {
  // Ferma il task esistente
  if (currentTask && currentTask.destroy) {
    currentTask.destroy()
    currentTask = null
  }

  // Aggiorna la configurazione
  currentSchedule = { ...config }

  if (!config.enabled || config.frequency === 'disabled') {
    console.log('Automatic backups disabled')
    return
  }

  // Gestisce backup multipli giornalieri
  if (config.frequency === 'custom' && config.multipleDaily?.length) {
    const tasks: cron.ScheduledTask[] = []
    
    for (const timeStr of config.multipleDaily) {
      const [hour, minute] = timeStr.split(':').map(Number)
      const cronPattern = `${minute ?? 0} ${hour ?? 3} * * *`
      
      try {
        const task = cron.schedule(cronPattern, executeAutoBackup, { timezone: 'Europe/Rome' })
        task.start()
        tasks.push(task)
        console.log(`Scheduled automatic backup at ${timeStr} (${cronPattern})`)
      } catch (error) {
        console.error(`Failed to schedule backup at ${timeStr}:`, error instanceof Error ? error.message : error)
      }
    }
    
    // Salva il primo task come riferimento per destroy
    currentTask = tasks[0] ?? null
    return
  }

  // Backup singolo
  const cronPattern = configToCronPattern(config)
  if (!cronPattern) {
    console.warn('Unable to generate cron pattern from config:', config)
    return
  }

  try {
    currentTask = cron.schedule(cronPattern, executeAutoBackup, { timezone: 'Europe/Rome' })
    currentTask.start()
    console.log(`Scheduled automatic backup with pattern: ${cronPattern}`)
  } catch (error) {
    console.error('Failed to schedule automatic backup:', error instanceof Error ? error.message : error)
  }
}

// Inizializza il sistema di backup automatico
export const initAutoBackup = (): void => {
  console.log('Initializing automatic backup system...')
  
  // Carica configurazione da variabili ambiente
  if (CONFIG.AUTO_BACKUP_ENABLED) {
    const envConfig: BackupScheduleConfig = {
      enabled: true,
      frequency: 'custom',
      mode: CONFIG.AUTO_BACKUP_MODE,
      cronPattern: CONFIG.AUTO_BACKUP_CRON,
    }
    updateScheduler(envConfig)
  } else {
    console.log('Automatic backups are disabled by default')
  }
}

// Ottiene la configurazione corrente
export const getCurrentSchedule = (): BackupScheduleConfig => {
  return { ...currentSchedule }
}

// Valida la configurazione
export const validateScheduleConfig = (config: unknown): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!config || typeof config !== 'object') {
    errors.push('Configuration must be an object')
    return { valid: false, errors }
  }

  const cfg = config as Record<string, unknown>

  // Valida enabled
  if (typeof cfg.enabled !== 'boolean') {
    errors.push('enabled must be a boolean')
  }

  // Valida frequency
  if (typeof cfg.frequency !== 'string' || !['disabled', 'daily', 'every-2-days', 'every-3-days', 'weekly', 'custom'].includes(cfg.frequency)) {
    errors.push('frequency must be one of: disabled, daily, every-2-days, every-3-days, weekly, custom')
  }

  // Valida mode
  if (typeof cfg.mode !== 'string' || !['full', 'world'].includes(cfg.mode)) {
    errors.push('mode must be either "full" or "world"')
  }

  // Valida dailyAt format
  if (cfg.dailyAt && typeof cfg.dailyAt === 'string') {
    const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/
    if (!timeRegex.test(cfg.dailyAt)) {
      errors.push('dailyAt must be in HH:MM format (24-hour)')
    }
  }

  // Valida weeklyOn
  if (cfg.weeklyOn !== undefined && (typeof cfg.weeklyOn !== 'number' || cfg.weeklyOn < 0 || cfg.weeklyOn > 6)) {
    errors.push('weeklyOn must be a number between 0 (Sunday) and 6 (Saturday)')
  }

  // Valida multipleDaily
  if (cfg.multipleDaily) {
    if (!Array.isArray(cfg.multipleDaily)) {
      errors.push('multipleDaily must be an array')
    } else {
      const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/
      for (const time of cfg.multipleDaily) {
        if (typeof time !== 'string' || !timeRegex.test(time)) {
          errors.push('multipleDaily times must be in HH:MM format (24-hour)')
          break
        }
      }
    }
  }

  // Valida cronPattern per custom
  if (cfg.frequency === 'custom' && cfg.cronPattern) {
    if (typeof cfg.cronPattern !== 'string') {
      errors.push('cronPattern must be a string')
    } else {
      try {
        cron.validate(cfg.cronPattern)
      } catch {
        errors.push('cronPattern is not a valid cron expression')
      }
    }
  }

  return { valid: errors.length === 0, errors }
}