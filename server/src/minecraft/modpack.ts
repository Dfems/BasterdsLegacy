import fsp from 'node:fs/promises'
import path from 'node:path'

import { CONFIG } from '../lib/config.js'

export type InstallRequest = {
  loader: 'Forge' | 'Fabric' | 'Quilt' | 'NeoForge'
  mcVersion: string
  manifest?: unknown
}

const EULA = 'eula.txt'
const JVM_ARGS = 'user_jvm_args.txt'

export const ensureEula = async () => {
  const file = path.join(CONFIG.MC_DIR, EULA)
  await fsp.mkdir(CONFIG.MC_DIR, { recursive: true })
  await fsp.writeFile(file, 'eula=true\n', 'utf8')
}

export const writeJvmArgs = async () => {
  const file = path.join(CONFIG.MC_DIR, JVM_ARGS)
  const content = ['-Xms1G', '-Xmx2G'].join('\n') + '\n'
  await fsp.writeFile(file, content, 'utf8')
}

export const installModpack = async (
  req: InstallRequest
): Promise<{ ok: true; notes: string[] }> => {
  const notes: string[] = []
  notes.push(`Requested loader=${req.loader} mc=${req.mcVersion}`)
  await ensureEula()
  await writeJvmArgs()
  // Placeholder: in step avanzato scaricheremo e avvieremo installer headless
  notes.push('EULA and basic JVM args written. Place your server.jar or run installer manually.')
  return { ok: true, notes }
}
