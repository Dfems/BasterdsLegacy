import fsp from 'node:fs/promises'
import path from 'node:path'

import { CONFIG } from '../lib/config.js'
import { rconEnabled, rconExec } from './rcon.js'

export type WhitelistAction = 'add' | 'remove'

const WL_FILE = path.join(CONFIG.MC_DIR, 'whitelist.json')

export const listWhitelist = async (): Promise<string[]> => {
  if (rconEnabled()) {
    const out = await rconExec('whitelist list')
    // Output tipico: "There are X whitelisted players: name1, name2"
    const parts = out.split(':')
    if (parts.length < 2) return []
    const names = parts[1] ?? ''
    return names
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  try {
    const data = await fsp.readFile(WL_FILE, 'utf8')
    const arr = JSON.parse(data) as Array<{ name?: string }>
    return arr.map((e) => e.name).filter((n): n is string => typeof n === 'string')
  } catch {
    return []
  }
}

export const updateWhitelist = async (action: WhitelistAction, player: string): Promise<void> => {
  if (rconEnabled()) {
    const cmd = action === 'add' ? `whitelist add ${player}` : `whitelist remove ${player}`
    await rconExec(cmd)
    return
  }
  // Fallback su file
  try {
    const data = await fsp.readFile(WL_FILE, 'utf8')
    const arr = (JSON.parse(data) as Array<{ name?: string }>).filter(Boolean)
    const set = new Set(arr.map((e) => e.name).filter((n): n is string => typeof n === 'string'))
    if (action === 'add') set.add(player)
    else set.delete(player)
    const next = [...set].map((name) => ({ name }))
    await fsp.writeFile(WL_FILE, JSON.stringify(next, null, 2), 'utf8')
  } catch {
    if (action === 'add') {
      const next = [{ name: player }]
      await fsp.mkdir(path.dirname(WL_FILE), { recursive: true })
      await fsp.writeFile(WL_FILE, JSON.stringify(next, null, 2), 'utf8')
    }
  }
}
