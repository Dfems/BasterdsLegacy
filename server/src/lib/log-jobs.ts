import cron from 'node-cron'

import { auditLog } from '../lib/audit.js'
import { CONFIG } from '../lib/config.js'
import { cleanupOldLogs } from '../lib/log-cleanup.js'

let cleanupTask: cron.ScheduledTask | null = null

/**
 * Esegue la pulizia dei log files
 */
const executeLogCleanup = async (): Promise<void> => {
  const startTime = Date.now()
  
  try {
    await auditLog({
      type: 'job',
      name: 'log-cleanup',
      op: 'start'
    })
    
    await cleanupOldLogs({
      logDir: CONFIG.LOG_DIR,
      maxFiles: CONFIG.LOG_MAX_FILES,
      retentionDays: CONFIG.LOG_RETENTION_DAYS
    })
    
    const duration = Date.now() - startTime
    
    await auditLog({
      type: 'job',
      name: 'log-cleanup',
      op: 'end',
      durationMs: duration,
      details: {
        logDir: CONFIG.LOG_DIR,
        maxFiles: CONFIG.LOG_MAX_FILES,
        retentionDays: CONFIG.LOG_RETENTION_DAYS
      }
    })
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    
    await auditLog({
      type: 'job',
      name: 'log-cleanup',
      op: 'error',
      durationMs: Date.now() - startTime,
      details: { error: errorMsg }
    })
    
    console.error('Log cleanup failed:', errorMsg)
  }
}

/**
 * Inizializza il sistema di pulizia automatica dei log
 */
export const initLogCleanup = (): void => {
  if (!CONFIG.LOG_FILE_ENABLED) {
    return
  }
  
  try {
    // Esegui pulizia ogni giorno alle 4:00 AM
    const cronPattern = '0 4 * * *'
    
    cleanupTask = cron.schedule(cronPattern, executeLogCleanup, {
      timezone: 'Europe/Rome'
    })
    
    cleanupTask.start()
    
    console.log(`Scheduled log cleanup job with pattern: ${cronPattern}`)
    
    // Esegui una pulizia iniziale dopo 30 secondi (per non interferire con startup)
    setTimeout(() => {
      executeLogCleanup().catch(error => {
        console.warn('Initial log cleanup failed:', error)
      })
    }, 30000)
    
  } catch (error) {
    console.error('Failed to initialize log cleanup:', error)
  }
}

/**
 * Ferma il job di pulizia log
 */
export const stopLogCleanup = (): void => {
  if (cleanupTask) {
    cleanupTask.destroy()
    cleanupTask = null
    console.log('Log cleanup job stopped')
  }
}

/**
 * Esegue una pulizia manuale dei log (per API)
 */
export const manualLogCleanup = async (): Promise<void> => {
  await executeLogCleanup()
}