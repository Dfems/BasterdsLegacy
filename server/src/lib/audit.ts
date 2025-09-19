import { db } from './db.js'
import pino from 'pino'
import { loggerOptions } from './logger.js'

export type AuditEvent =
  | {
      type: 'command'
      cmd: string
      userId?: string | undefined
      exit?: number | null | undefined
      durationMs?: number | null | undefined
    }
  | { type: 'login'; userId: string }
  | { type: 'logout'; userId?: string | undefined }
  | { type: 'file'; op: 'rename' | 'delete' | 'upload' | 'zip' | 'unzip' | 'download' | 'read' | 'edit'; path: string; userId?: string | undefined }
  | { type: 'power'; op: 'start' | 'stop' | 'restart'; userId?: string | undefined }
  | { type: 'backup'; op: 'create' | 'restore' | 'schedule_update' | 'schedule_save' | 'schedule_save_error' | 'schedule_load'; id?: string | undefined; userId?: string | undefined; details?: Record<string, unknown> | undefined }
  | { type: 'job'; name: string; op: 'start' | 'end' | 'error'; durationMs?: number | undefined; details?: Record<string, unknown> | undefined }
  | { type: 'server'; op: 'startup' | 'shutdown' | 'config_change'; details?: Record<string, unknown> | undefined }
  | { type: 'user'; op: 'create' | 'delete' | 'update' | 'password_change'; targetUserId?: string | undefined; userId?: string | undefined; details?: Record<string, unknown> | undefined }
  | { type: 'whitelist'; op: 'add' | 'remove'; playerName: string; userId?: string | undefined; details?: Record<string, unknown> | undefined }

// Logger centralizzato per log strutturati - sarà importato dinamicamente per evitare dipendenze circolari
type AppLogger = {
  info: (obj: unknown, msg?: string) => void
  warn: (obj: unknown, msg?: string) => void
  error: (obj: unknown, msg?: string) => void
}

let appLogger: AppLogger | null = null

const getLogger = async (): Promise<AppLogger> => {
  if (!appLogger) {
    try {
      const p = pino(loggerOptions as pino.LoggerOptions)
      appLogger = {
        info: (obj, msg) => p.info(obj as Record<string, unknown>, msg),
        warn: (obj, msg) => p.warn(obj as Record<string, unknown>, msg),
        error: (obj, msg) => p.error(obj as Record<string, unknown>, msg),
      }
    } catch (error) {
      console.warn('Failed to init audit logger, using console:', error)
      appLogger = {
        info: (obj, msg) => console.log(msg ?? '', obj),
        warn: (obj, msg) => console.warn(msg ?? '', obj),
        error: (obj, msg) => console.error(msg ?? '', obj),
      }
    }
  }
  return appLogger
}

// Messaggi human-readable per i log
const getHumanMessage = (evt: AuditEvent): string => {
  if (evt.type === 'command') {
    return `Server command executed: ${evt.cmd}${evt.exit !== undefined ? ` (exit code: ${evt.exit})` : ''}`
  } else if (evt.type === 'login') {
    return 'User logged in successfully'
  } else if (evt.type === 'logout') {
    return 'User logged out'
  } else if (evt.type === 'file') {
    switch (evt.op) {
      case 'upload': return `File uploaded: ${evt.path}`
      case 'delete': return `File deleted: ${evt.path}`
      case 'rename': return `File renamed: ${evt.path}`
      case 'zip': return `Files compressed: ${evt.path}`
      case 'unzip': return `Archive extracted: ${evt.path}`
      case 'download': return `File downloaded: ${evt.path}`
      case 'read': return `File read: ${evt.path}`
      case 'edit': return `File edited: ${evt.path}`
    }
  } else if (evt.type === 'power') {
    switch (evt.op) {
      case 'start': return 'Minecraft server started'
      case 'stop': return 'Minecraft server stopped'
      case 'restart': return 'Minecraft server restarted'
    }
  } else if (evt.type === 'backup') {
    switch (evt.op) {
      case 'create': return `Backup created${evt.id ? `: ${evt.id}` : ''}`
      case 'restore': return `Backup restored${evt.id ? `: ${evt.id}` : ''}`
      case 'schedule_update': return 'Backup schedule updated'
      case 'schedule_save': return 'Backup schedule saved to database'
      case 'schedule_save_error': return 'Failed to save backup schedule to database'
      case 'schedule_load': return 'Backup schedule loaded from database'
    }
  } else if (evt.type === 'job') {
    switch (evt.op) {
      case 'start': return `Automated job started: ${evt.name}`
      case 'end': return `Automated job completed: ${evt.name}${evt.durationMs ? ` (duration: ${evt.durationMs}ms)` : ''}`
      case 'error': return `Automated job failed: ${evt.name}`
    }
  } else if (evt.type === 'server') {
    switch (evt.op) {
      case 'startup': return 'Server application started'
      case 'shutdown': return 'Server application stopped'
      case 'config_change': return 'Server configuration changed'
    }
  } else if (evt.type === 'user') {
    switch (evt.op) {
      case 'create': return 'New user account created'
      case 'delete': return 'User account deleted'
      case 'update': return 'User account updated'
      case 'password_change': return 'User password changed'
    }
  } else if (evt.type === 'whitelist') {
    switch (evt.op) {
      case 'add': return `Player added to whitelist: ${evt.playerName}`
      case 'remove': return `Player removed from whitelist: ${evt.playerName}`
    }
  }
  
  return `${(evt as { type: string }).type} operation completed`
}

export const auditLog = async (evt: AuditEvent) => {
  try {
    // Log nel database per audit (esistente)
    if (evt.type === 'command') {
      await db.commandHistory.create({
        data: {
          cmd: evt.cmd,
          exit: evt.exit ?? null,
          durationMs: evt.durationMs ?? null,
          userId: evt.userId ?? null,
        },
      })
    } else if (evt.type === 'login') {
      await db.setting.upsert({
        where: { key: 'lastLogin' },
        update: { value: new Date().toISOString() },
        create: { key: 'lastLogin', value: new Date().toISOString() },
      })
    }
    
    // Log strutturato nell'application logger
    const logger = await getLogger()
    const message = getHumanMessage(evt)
    
    const logData = {
      auditType: 'audit_event',
      eventType: evt.type,
      timestamp: new Date().toISOString(),
      userId: ('userId' in evt ? evt.userId : undefined),
      ...evt,
    }
    
    // Usa il livello appropriato basato sul tipo di evento
    if (evt.type === 'job' && evt.op === 'error') {
      logger?.error(logData, `❌ ${message}`)
    } else if (evt.type === 'power' || evt.type === 'server') {
      logger?.warn(logData, `⚡ ${message}`)
    } else {
      logger?.info(logData, `📝 ${message}`)
    }
    
  } catch (error) {
    // Non bloccare il flusso in caso di errore logging
    console.warn('Failed to log audit event:', error)
  }
}
