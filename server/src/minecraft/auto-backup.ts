import cron from 'node-cron'

import { auditLog } from '../lib/audit.js'
import { CONFIG, getConfig } from '../lib/config.js'
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

// Salva la configurazione del backup automatico nel database
const saveScheduleToDatabase = async (config: BackupScheduleConfig): Promise<void> => {
  try {
    const { db } = await import('../lib/db.js')

    // Log dell'operazione di salvataggio
    await auditLog({
      type: 'backup',
      op: 'schedule_save',
      details: {
        enabled: config.enabled,
        frequency: config.frequency,
        mode: config.mode,
        source: 'ui_configuration',
      },
    })

    // Salva le configurazioni come settings nel database
    const updates = [
      { key: 'backup.schedule.enabled', value: config.enabled.toString() },
      { key: 'backup.schedule.frequency', value: config.frequency },
      { key: 'backup.schedule.mode', value: config.mode },
    ]

    if (config.dailyAt) {
      updates.push({ key: 'backup.schedule.dailyAt', value: config.dailyAt })
    }

    if (config.weeklyOn !== undefined) {
      updates.push({ key: 'backup.schedule.weeklyOn', value: config.weeklyOn.toString() })
    }

    if (config.cronPattern) {
      updates.push({ key: 'backup.schedule.cronPattern', value: config.cronPattern })
    }

    if (config.multipleDaily) {
      updates.push({ key: 'backup.schedule.multipleDaily', value: config.multipleDaily.join(',') })
    }

    // Salva nel database
    for (const update of updates) {
      await db.setting.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value },
      })
    }

    console.log('Backup schedule configuration saved to database')
  } catch (error) {
    console.error('Failed to save backup schedule to database:', error)

    // Log dell'errore
    await auditLog({
      type: 'backup',
      op: 'schedule_save_error',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        config: config,
      },
    })

    throw error
  }
}

// Carica la configurazione del backup automatico dal database
const loadScheduleFromDatabase = async (): Promise<BackupScheduleConfig | null> => {
  try {
    const { db } = await import('../lib/db.js')

    const settings = await db.setting.findMany({
      where: {
        key: {
          in: [
            'backup.schedule.enabled',
            'backup.schedule.frequency',
            'backup.schedule.mode',
            'backup.schedule.dailyAt',
            'backup.schedule.weeklyOn',
            'backup.schedule.cronPattern',
            'backup.schedule.multipleDaily',
          ],
        },
      },
    })

    if (settings.length === 0) {
      return null // Nessuna configurazione salvata
    }

    const config: Partial<BackupScheduleConfig> = {}

    for (const setting of settings) {
      switch (setting.key) {
        case 'backup.schedule.enabled':
          config.enabled = setting.value === 'true'
          break
        case 'backup.schedule.frequency':
          config.frequency = setting.value as BackupFrequency
          break
        case 'backup.schedule.mode':
          config.mode = setting.value as 'full' | 'world'
          break
        case 'backup.schedule.dailyAt':
          config.dailyAt = setting.value
          break
        case 'backup.schedule.weeklyOn':
          config.weeklyOn = parseInt(setting.value, 10)
          break
        case 'backup.schedule.cronPattern':
          config.cronPattern = setting.value
          break
        case 'backup.schedule.multipleDaily':
          config.multipleDaily = setting.value.split(',').filter(Boolean)
          break
      }
    }

    // Assicuriamoci che i campi obbligatori siano presenti
    if (config.enabled !== undefined && config.frequency && config.mode) {
      const result = config as BackupScheduleConfig

      // Log del caricamento riuscito
      await auditLog({
        type: 'backup',
        op: 'schedule_load',
        details: {
          enabled: result.enabled,
          frequency: result.frequency,
          mode: result.mode,
          source: 'database',
        },
      })

      return result
    }

    return null
  } catch (error) {
    console.error('Failed to load backup schedule from database:', error)
    return null
  }
}

// Configurazione default (usa le configurazioni da database se disponibili, altrimenti fallback env)
const getDefaultSchedule = async (): Promise<BackupScheduleConfig> => {
  // Prima prova a caricare dal database
  const dbConfig = await loadScheduleFromDatabase()
  if (dbConfig) {
    console.log('Loaded backup schedule from database')
    return dbConfig
  }

  // Fallback alle configurazioni da variabili d'ambiente
  try {
    const config = await getConfig()
    console.log('Using backup schedule from environment variables')
    return {
      enabled: config.AUTO_BACKUP_ENABLED,
      frequency: config.AUTO_BACKUP_ENABLED ? 'custom' : 'disabled',
      mode: config.AUTO_BACKUP_MODE,
      cronPattern: config.AUTO_BACKUP_CRON,
      dailyAt: '03:00',
    }
  } catch (error) {
    // Fallback alle configurazioni statiche se il database non è disponibile
    console.warn('Failed to load config from database, using static config:', error)
    return {
      enabled: CONFIG.AUTO_BACKUP_ENABLED,
      frequency: CONFIG.AUTO_BACKUP_ENABLED ? 'custom' : 'disabled',
      mode: CONFIG.AUTO_BACKUP_MODE,
      cronPattern: CONFIG.AUTO_BACKUP_CRON,
      dailyAt: '03:00',
    }
  }
}

// Stato globale della configurazione
let currentSchedule: BackupScheduleConfig | null = null
let currentTask: cron.ScheduledTask | null = null

// Preset predefiniti per facilità d'uso
export const BACKUP_PRESETS = {
  disabled: { enabled: false, frequency: 'disabled' as const },
  daily_3am: {
    enabled: true,
    frequency: 'daily' as const,
    mode: 'world' as const,
    dailyAt: '03:00',
  },
  daily_2am: {
    enabled: true,
    frequency: 'daily' as const,
    mode: 'world' as const,
    dailyAt: '02:00',
  },
  every_2_days: {
    enabled: true,
    frequency: 'every-2-days' as const,
    mode: 'world' as const,
    dailyAt: '03:00',
  },
  every_3_days: {
    enabled: true,
    frequency: 'every-3-days' as const,
    mode: 'world' as const,
    dailyAt: '03:00',
  },
  weekly_monday: {
    enabled: true,
    frequency: 'weekly' as const,
    mode: 'full' as const,
    weeklyOn: 1,
    dailyAt: '03:00',
  },
  weekly_sunday: {
    enabled: true,
    frequency: 'weekly' as const,
    mode: 'full' as const,
    weeklyOn: 0,
    dailyAt: '03:00',
  },
  triple_daily: {
    enabled: true,
    frequency: 'custom' as const,
    mode: 'world' as const,
    multipleDaily: ['08:00', '14:00', '20:00'],
  },
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
  const startTime = Date.now()

  try {
    if (!currentSchedule) {
      console.error('Cannot execute automatic backup: no schedule configured')
      return
    }

    console.log(`Starting automatic backup (mode: ${currentSchedule.mode})...`)

    // Log inizio job
    await auditLog({
      type: 'job',
      name: 'automatic-backup',
      op: 'start',
      details: { mode: currentSchedule.mode },
    })

    const backup = await createBackup(currentSchedule.mode)

    const duration = Date.now() - startTime
    console.log(
      `Automatic backup completed successfully: ${backup.id} (${(backup.size / 1024 / 1024).toFixed(2)} MB)`
    )

    // Log successo job
    await auditLog({
      type: 'job',
      name: 'automatic-backup',
      op: 'end',
      durationMs: duration,
      details: {
        backupId: backup.id,
        size: backup.size,
        mode: currentSchedule.mode,
        sizeFormatted: `${(backup.size / 1024 / 1024).toFixed(2)} MB`,
      },
    })

    // Applica retention policy dopo ogni backup automatico
    try {
      await auditLog({
        type: 'job',
        name: 'backup-retention',
        op: 'start',
      })

      await applyRetention()
      console.log('Retention policy applied successfully')

      await auditLog({
        type: 'job',
        name: 'backup-retention',
        op: 'end',
      })
    } catch (retentionError) {
      console.warn(
        'Failed to apply retention policy:',
        retentionError instanceof Error ? retentionError.message : retentionError
      )

      await auditLog({
        type: 'job',
        name: 'backup-retention',
        op: 'error',
        details: {
          error: retentionError instanceof Error ? retentionError.message : 'Unknown error',
        },
      })
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Automatic backup failed:', errorMsg)

    // Log errore job
    await auditLog({
      type: 'job',
      name: 'automatic-backup',
      op: 'error',
      durationMs: Date.now() - startTime,
      details: {
        error: errorMsg,
        mode: currentSchedule?.mode || 'unknown',
      },
    })

    // Non rilanciamo l'errore per non interrompere il scheduler
  }
}

// Avvia/ferma i task cron
export const updateScheduler = async (config: BackupScheduleConfig): Promise<void> => {
  // Ferma il task esistente
  if (currentTask && currentTask.destroy) {
    currentTask.destroy()
    currentTask = null
  }

  // Aggiorna la configurazione
  currentSchedule = { ...config }

  // Salva la configurazione nel database
  try {
    await saveScheduleToDatabase(config)
    console.log(
      `Backup schedule updated: ${config.enabled ? 'enabled' : 'disabled'} (${config.frequency})`
    )
  } catch (error) {
    console.warn('Failed to save backup schedule to database:', error)
    // Non blocchiamo l'operazione se il salvataggio fallisce
  }

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
        console.error(
          `Failed to schedule backup at ${timeStr}:`,
          error instanceof Error ? error.message : error
        )
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
    console.error(
      'Failed to schedule automatic backup:',
      error instanceof Error ? error.message : error
    )
  }
}

// Inizializza il sistema di backup automatico
export const initAutoBackup = async (): Promise<void> => {
  console.log('Initializing automatic backup system...')

  await auditLog({
    type: 'server',
    op: 'startup',
    details: { component: 'automatic-backup-system' },
  })

  // Carica configurazione dal database o fallback a variabili ambiente
  try {
    const defaultConfig = await getDefaultSchedule()
    currentSchedule = defaultConfig

    if (defaultConfig.enabled) {
      await updateScheduler(defaultConfig)
    } else {
      console.log('Automatic backups are disabled')
    }
  } catch (error) {
    console.error('Failed to load backup configuration:', error)
    currentSchedule = {
      enabled: false,
      frequency: 'disabled',
      mode: 'world',
      dailyAt: '03:00',
    }
  }
}

// Ottiene la configurazione corrente
export const getCurrentSchedule = (): BackupScheduleConfig => {
  if (!currentSchedule) {
    throw new Error('Backup schedule not initialized')
  }
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
  if (
    typeof cfg.frequency !== 'string' ||
    !['disabled', 'daily', 'every-2-days', 'every-3-days', 'weekly', 'custom'].includes(
      cfg.frequency
    )
  ) {
    errors.push(
      'frequency must be one of: disabled, daily, every-2-days, every-3-days, weekly, custom'
    )
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
  if (
    cfg.weeklyOn !== undefined &&
    (typeof cfg.weeklyOn !== 'number' || cfg.weeklyOn < 0 || cfg.weeklyOn > 6)
  ) {
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
