import { db } from './db.js'

export type AuditEvent =
  | {
      type: 'command'
      cmd: string
      userId?: string | undefined
      exit?: number | null | undefined
      durationMs?: number | null | undefined
    }
  | { type: 'login'; userId: string }
  | { type: 'file'; op: 'rename' | 'delete' | 'upload' | 'zip' | 'unzip'; path: string; userId?: string | undefined }
  | { type: 'power'; op: 'start' | 'stop' | 'restart'; userId?: string | undefined }
  | { type: 'backup'; op: 'create' | 'restore'; id?: string | undefined; userId?: string | undefined }

export const auditLog = async (evt: AuditEvent) => {
  try {
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
      // Forse utile per futuri report, ora noop in Setting o log
      await db.setting.upsert({
        where: { key: 'lastLogin' },
        update: { value: new Date().toISOString() },
        create: { key: 'lastLogin', value: new Date().toISOString() },
      })
    }
  } catch {
    // non bloccare flusso in caso di errore db
  }
}
