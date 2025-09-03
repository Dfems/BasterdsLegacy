import { spawn } from 'node:child_process'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'

import { CONFIG } from '../lib/config.js'

export type InstallRequest = {
  mode: 'automatic' | 'manual'
  loader?: 'Forge' | 'Fabric' | 'Quilt' | 'NeoForge'
  mcVersion?: string
  jarFileName?: string
  manifest?: unknown
}

const EULA = 'eula.txt'
const JVM_ARGS = 'user_jvm_args.txt'

export const ensureEula = async (): Promise<void> => {
  const file = path.join(CONFIG.MC_DIR, EULA)
  await fsp.mkdir(CONFIG.MC_DIR, { recursive: true })
  await fsp.writeFile(file, 'eula=true\n', 'utf8')
}

export const writeJvmArgs = async (): Promise<void> => {
  const file = path.join(CONFIG.MC_DIR, JVM_ARGS)
  const content = ['-Xms1G', '-Xmx2G'].join('\n') + '\n'
  await fsp.writeFile(file, content, 'utf8')
}

const downloadToFile = async (url: string, dest: string): Promise<void> => {
  await fsp.mkdir(path.dirname(dest), { recursive: true })
  await new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https
      .get(url, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          // follow redirect
          const loc = res.headers.location
          res.resume()
          downloadToFile(loc.startsWith('http') ? loc : new URL(loc, url).toString(), dest)
            .then(resolve)
            .catch(reject)
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: ${res.statusCode}`))
          return
        }
        res.pipe(file)
        file.on('finish', () => file.close(() => resolve()))
      })
      .on('error', (err) => reject(err))
  })
}

const runJavaJar = async (jarPath: string, args: string[], cwd: string): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const ps = spawn(CONFIG.JAVA_BIN, ['-jar', jarPath, ...args], {
      cwd,
      stdio: 'inherit',
      shell: false,
    })
    ps.on('error', reject)
    ps.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Installer exited with code ${code}`))
    })
  })
}

// Installazione di Fabric
const installFabric = async (mcVersion: string, notes: string[]): Promise<void> => {
  const installerJar = path.join(CONFIG.MC_DIR, 'fabric-installer.jar')
  const url = 'https://maven.fabricmc.net/net/fabricmc/fabric-installer/latest/fabric-installer.jar'
  try {
    await downloadToFile(url, installerJar)
    notes.push('Scaricato fabric-installer.jar')
    await runJavaJar(
      installerJar,
      ['server', '-mcversion', mcVersion, '-downloadMinecraft'],
      CONFIG.MC_DIR
    )
    notes.push('Fabric server installato')
  } catch (e) {
    notes.push(`Errore installazione Fabric: ${(e as Error).message}`)
    throw e
  }
}

// Installazione di Forge
const installForge = async (mcVersion: string, notes: string[]): Promise<void> => {
  try {
    // URL del forge installer (esempio per versione 1.21.1)
    const forgeVersion = await getLatestForgeVersion(mcVersion)
    if (!forgeVersion) {
      throw new Error(`Versione Forge non trovata per MC ${mcVersion}`)
    }
    const fileName = `forge-${mcVersion}-${forgeVersion}-installer.jar`
    const installerJar = path.join(CONFIG.MC_DIR, fileName)
    const url = `https://maven.minecraftforge.net/net/minecraftforge/forge/${mcVersion}-${forgeVersion}/forge-${mcVersion}-${forgeVersion}-installer.jar`

    await downloadToFile(url, installerJar)
    notes.push(`Scaricato ${fileName}`)

    await runJavaJar(installerJar, ['--installServer'], CONFIG.MC_DIR)
    notes.push('Forge server installato')
  } catch (e) {
    notes.push(`Errore installazione Forge: ${(e as Error).message}`)
    throw e
  }
}

// Installazione di NeoForge
const installNeoForge = async (mcVersion: string, notes: string[]): Promise<void> => {
  try {
    const neoForgeVersion = await getLatestNeoForgeVersion(mcVersion)
    if (!neoForgeVersion) {
      throw new Error(`Versione NeoForge non trovata per MC ${mcVersion}`)
    }
    const fileName = `neoforge-${neoForgeVersion}-installer.jar`
    const installerJar = path.join(CONFIG.MC_DIR, fileName)
    const url = `https://maven.neoforged.net/net/neoforged/neoforge/${neoForgeVersion}/neoforge-${neoForgeVersion}-installer.jar`

    await downloadToFile(url, installerJar)
    notes.push(`Scaricato ${fileName}`)

    await runJavaJar(installerJar, ['--installServer'], CONFIG.MC_DIR)
    notes.push('NeoForge server installato')
  } catch (e) {
    notes.push(`Errore installazione NeoForge: ${(e as Error).message}`)
    throw e
  }
}

// Installazione di Quilt
const installQuilt = async (mcVersion: string, notes: string[]): Promise<void> => {
  try {
    const installerJar = path.join(CONFIG.MC_DIR, 'quilt-installer.jar')
    const url =
      'https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-installer/latest/quilt-installer.jar'

    await downloadToFile(url, installerJar)
    notes.push('Scaricato quilt-installer.jar')

    await runJavaJar(
      installerJar,
      ['install', 'server', mcVersion, '--download-server'],
      CONFIG.MC_DIR
    )
    notes.push('Quilt server installato')
  } catch (e) {
    notes.push(`Errore installazione Quilt: ${(e as Error).message}`)
    throw e
  }
}

// Installazione da JAR personalizzato
const installFromCustomJar = async (jarFileName: string, notes: string[]): Promise<void> => {
  const jarPath = path.join(CONFIG.MC_DIR, jarFileName)
  try {
    // Verifica che il file esista
    await fsp.access(jarPath)
    notes.push(`Trovato JAR personalizzato: ${jarFileName}`)

    // Prova diversi argomenti comuni per gli installer
    const commonArgs = ['--installServer', 'install server', 'server']
    let installed = false

    for (const args of commonArgs) {
      try {
        await runJavaJar(jarPath, args.split(' '), CONFIG.MC_DIR)
        notes.push(`Installato usando argomenti: ${args}`)
        installed = true
        break
      } catch (e) {
        notes.push(`Tentativo con argomenti '${args}' fallito`)
      }
    }

    if (!installed) {
      throw new Error('Nessun metodo di installazione standard ha funzionato')
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`File ${jarFileName} non trovato nella directory del server`)
    }
    notes.push(`Errore installazione JAR personalizzato: ${(e as Error).message}`)
    throw e
  }
}

// Funzioni helper per ottenere le versioni più recenti
const getLatestForgeVersion = async (mcVersion: string): Promise<string | null> => {
  // Per ora utilizziamo versioni statiche, in futuro si può implementare l'API di Forge
  const staticVersions: Record<string, string> = {
    '1.21.1': '52.0.31',
    '1.21': '51.0.33',
    '1.20.1': '47.3.12',
    '1.19.2': '43.4.4',
  }
  return staticVersions[mcVersion] || null
}

const getLatestNeoForgeVersion = async (mcVersion: string): Promise<string | null> => {
  // Per ora utilizziamo versioni statiche, in futuro si può implementare l'API di NeoForge
  const staticVersions: Record<string, string> = {
    '1.21.1': '21.1.95',
    '1.21': '21.0.207',
    '1.20.1': '20.1.241',
  }
  return staticVersions[mcVersion] || null
}

// Funzione per ottenere tutte le versioni supportate
export const getSupportedVersions = async (): Promise<{
  minecraft: string[]
  loaders: Record<string, { label: string; versions: Record<string, string> }>
}> => {
  const minecraftVersions = [
    '1.21.1',
    '1.21',
    '1.20.6',
    '1.20.4',
    '1.20.1',
    '1.19.4',
    '1.19.2',
    '1.18.2',
    '1.17.1',
    '1.16.5',
  ]

  const loaders = {
    Fabric: {
      label: 'Fabric',
      versions: {
        '1.21.1': 'latest',
        '1.21': 'latest',
        '1.20.6': 'latest',
        '1.20.4': 'latest',
        '1.20.1': 'latest',
        '1.19.4': 'latest',
        '1.19.2': 'latest',
        '1.18.2': 'latest',
      },
    },
    Forge: {
      label: 'Forge',
      versions: {
        '1.21.1': '52.0.31',
        '1.21': '51.0.33',
        '1.20.1': '47.3.12',
        '1.19.2': '43.4.4',
      },
    },
    NeoForge: {
      label: 'NeoForge',
      versions: {
        '1.21.1': '21.1.95',
        '1.21': '21.0.207',
        '1.20.1': '20.1.241',
      },
    },
    Quilt: {
      label: 'Quilt',
      versions: {
        '1.21.1': 'latest',
        '1.21': 'latest',
        '1.20.6': 'latest',
        '1.20.4': 'latest',
        '1.20.1': 'latest',
      },
    },
  }

  return { minecraft: minecraftVersions, loaders }
}

export const installModpack = async (
  req: InstallRequest
): Promise<{ ok: true; notes: string[] }> => {
  const notes: string[] = []

  if (req.mode === 'automatic') {
    if (!req.loader || !req.mcVersion) {
      throw new Error('Loader e versione MC sono richiesti per modalità automatica')
    }
    notes.push(`Modalità automatica: loader=${req.loader} mc=${req.mcVersion}`)
    await ensureEula()
    await writeJvmArgs()
    await fsp.mkdir(CONFIG.MC_DIR, { recursive: true })

    if (req.loader === 'Fabric') {
      await installFabric(req.mcVersion, notes)
    } else if (req.loader === 'Forge') {
      await installForge(req.mcVersion, notes)
    } else if (req.loader === 'NeoForge') {
      await installNeoForge(req.mcVersion, notes)
    } else if (req.loader === 'Quilt') {
      await installQuilt(req.mcVersion, notes)
    }
  } else if (req.mode === 'manual') {
    if (!req.jarFileName) {
      throw new Error('Nome del file JAR è richiesto per modalità manuale')
    }
    notes.push(`Modalità manuale: jar=${req.jarFileName}`)
    await ensureEula()
    await writeJvmArgs()
    await installFromCustomJar(req.jarFileName, notes)
  }

  notes.push('EULA e JVM args configurati.')
  return { ok: true, notes }
}
