import fsp from 'node:fs/promises'
import path from 'node:path'

import { CONFIG } from '../lib/config.js'
import type { LogEvent } from './process.js'

const LOG_DIR = path.join(CONFIG.MC_DIR, 'logs')
const LATEST = path.join(LOG_DIR, 'latest.log')

const ensureDir = async () => {
  await fsp.mkdir(LOG_DIR, { recursive: true })
}

export const appendLog = (evt: LogEvent) => {
  void (async () => {
    await ensureDir()
    const line = `${new Date(evt.ts).toISOString()} ${evt.line}\n`
    await fsp.appendFile(LATEST, line, 'utf8')
  })()
}

export const rotateIfNeeded = async () => {
  await ensureDir()
  // Rotazione giornaliera semplice basata su data di modifica
  try {
    const stat = await fsp.stat(LATEST)
    const d = new Date(stat.mtime)
    const now = new Date()
    const dayChanged =
      d.getUTCFullYear() !== now.getUTCFullYear() ||
      d.getUTCMonth() !== now.getUTCMonth() ||
      d.getUTCDate() !== now.getUTCDate()
    if (dayChanged) {
      const name = `server-${d.toISOString().slice(0, 10)}.log`
      const dest = path.join(LOG_DIR, name)
      await fsp.rename(LATEST, dest)
    }
  } catch {
    // file non esistente: sarà creato al primo append
  }
}

export const readLogs = async (cursor?: number, limit = 1000) => {
  await ensureDir()
  // Lettura naive dell'ultimo file; ottimizzazioni future: stream + paginazione per offset
  let data = ''
  try {
    data = await fsp.readFile(LATEST, 'utf8')
  } catch {
    return { lines: [] as string[], nextCursor: undefined as number | undefined }
  }
  const lines = data.split(/\r?\n/).filter(Boolean)
  const filtered =
    typeof cursor === 'number'
      ? lines.filter((l) => {
          const ts = Date.parse(l.slice(0, 24)) // ISO slice
          return Number.isFinite(ts) && ts > cursor
        })
      : lines
  const slice = filtered.slice(-limit)
  let last: number | undefined
  if (slice.length > 0) {
    const idx = slice.length - 1
    const lastLine = slice[idx]
    if (typeof lastLine === 'string') {
      last = Date.parse(lastLine.slice(0, 24))
    }
  }
  return { lines: slice, nextCursor: Number.isFinite(last ?? NaN) ? (last as number) : undefined }
}
