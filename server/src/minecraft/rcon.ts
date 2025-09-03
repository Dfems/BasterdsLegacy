import { Rcon } from 'rcon-client'

import { CONFIG } from '../lib/config.js'

export type RconClient = InstanceType<typeof Rcon>

let client: RconClient | null = null

export const rconEnabled = () => CONFIG.RCON_ENABLED && CONFIG.RCON_PASS.length > 0

export const getRcon = async (): Promise<RconClient> => {
  if (!rconEnabled()) throw new Error('RCON disabled')
  if (client) return client
  client = await Rcon.connect({
    host: CONFIG.RCON_HOST,
    port: CONFIG.RCON_PORT,
    password: CONFIG.RCON_PASS,
  })
  client.on('end', () => {
    client = null
  })
  return client
}

export const rconExec = async (cmd: string): Promise<string> => {
  const c = await getRcon()
  const res = await c.send(cmd)
  return typeof res === 'string' ? res : String(res)
}
