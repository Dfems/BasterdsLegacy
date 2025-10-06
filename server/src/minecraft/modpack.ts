import { spawn } from 'node:child_process'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'

import { CONFIG } from '../lib/config.js'

type ManifestVersion = {
  id: string
  type: string
  url: string
  time: string
  releaseTime: string
}

export type InstallRequest = {
  mode: 'automatic' | 'manual'
  loader?: 'Vanilla' | 'Forge' | 'Fabric' | 'Quilt' | 'NeoForge'
  mcVersion?: string
  loaderVersion?: string // Versione specifica del loader (opzionale, default: latest/recommended)
  jarFileName?: string
  manifest?: unknown
}

const EULA = 'eula.txt'
const JVM_ARGS = 'user_jvm_args.txt'
const INSTALLATION_INFO = '.installation_info.json'
const RUN_BAT = 'run.bat'
const RUN_SH = 'run.sh'

// Funzioni per gestire le informazioni sull'installazione
const saveInstallationInfo = async (info: {
  mode: string
  loader?: string
  loaderVersion?: string
  mcVersion?: string
}): Promise<void> => {
  const file = path.join(CONFIG.MC_DIR, INSTALLATION_INFO)
  await fsp.writeFile(file, JSON.stringify(info, null, 2), 'utf8')
}

export const loadInstallationInfo = async (): Promise<{
  mode?: string
  loader?: string
  loaderVersion?: string
  mcVersion?: string
} | null> => {
  try {
    const file = path.join(CONFIG.MC_DIR, INSTALLATION_INFO)
    const content = await fsp.readFile(file, 'utf8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

type InstallInfo = {
  mode?: string
  loader?: string
  loaderVersion?: string
  mcVersion?: string
}

export const saveLastInstalledToDb = async (info: InstallInfo): Promise<void> => {
  try {
    const { db } = await import('../lib/db.js')
    const entries: Array<[string, string]> = []
    if (info.mode) entries.push(['modpack.mode', info.mode])
    if (info.loader) entries.push(['modpack.loader', info.loader])
    if (info.loaderVersion) entries.push(['modpack.loaderVersion', info.loaderVersion])
    if (info.mcVersion) entries.push(['modpack.mcVersion', info.mcVersion])
    for (const [key, value] of entries) {
      await db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    }
  } catch {
    // Se il DB non è disponibile, ignora (fallback al file)
  }
}

export const loadLastInstalledFromDb = async (): Promise<InstallInfo | null> => {
  try {
    const { db } = await import('../lib/db.js')
    const keys = ['modpack.mode', 'modpack.loader', 'modpack.loaderVersion', 'modpack.mcVersion']
    const rows = await db.setting.findMany({ where: { key: { in: keys } } })
    const out: InstallInfo = {}
    for (const row of rows) {
      switch (row.key) {
        case 'modpack.mode':
          out.mode = row.value
          break
        case 'modpack.loader':
          out.loader = row.value
          break
        case 'modpack.loaderVersion':
          out.loaderVersion = row.value
          break
        case 'modpack.mcVersion':
          out.mcVersion = row.value
          break
      }
    }
    return Object.keys(out).length ? out : null
  } catch {
    return null
  }
}

// Risolve le informazioni d'installazione includendo fallback dal filesystem (installer JAR)
export const getResolvedInstallationInfo = async (): Promise<{
  mode?: string
  loader?: string
  loaderVersion?: string
  mcVersion?: string
} | null> => {
  const info = (await loadInstallationInfo()) ?? {}
  try {
    const entries = await fsp.readdir(CONFIG.MC_DIR)
    // Rileva NeoForge: neoforge-<version>-installer.jar
    const neo = entries.find((f) => /^neoforge-[^-]+-installer\.jar$/i.test(f))
    if (!info.loaderVersion && (info.loader === 'NeoForge' || neo)) {
      if (neo) {
        const m = neo.match(/^neoforge-([^-]+)-installer\.jar$/i)
        if (m) {
          info.loader = 'NeoForge'
          info.loaderVersion = m[1]!
        }
      }
    }
    // Rileva Forge: forge-<mcVersion>-<loaderVersion>-installer.jar
    const forge = entries.find((f) => /^forge-\d+\.\d+(?:\.\d+)?-[^-]+-installer\.jar$/i.test(f))
    if (!info.loaderVersion && (info.loader === 'Forge' || forge)) {
      if (forge) {
        const m = forge.match(/^forge-(\d+\.\d+(?:\.\d+)?)-([^-]+)-installer\.jar$/i)
        if (m) {
          info.loader = 'Forge'
          if (!info.mcVersion) info.mcVersion = m[1]!
          info.loaderVersion = m[2]!
        }
      }
    }
    // Fabric/Quilt: lasciamo 'latest' non determinabile
  } catch {
    // ignora errori di lettura directory
  }
  return Object.keys(info).length ? info : null
}

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

// ---------------------------------------------------------------------------
// Rilevazione jar server finale & generazione script di avvio
// Alcuni installer (Forge / NeoForge / Fabric / Quilt) generano un jar "launch"
// diverso dal file *-installer.jar. Automatizziamo la creazione di run.sh / run.bat
// per evitare passaggi manuali.
// ---------------------------------------------------------------------------

const detectServerLaunchJar = async (): Promise<string | null> => {
  try {
    const entries = await fsp.readdir(CONFIG.MC_DIR)
    const jarFiles = entries.filter((f) => f.toLowerCase().endsWith('.jar'))
    const candidates: string[] = []
    for (const file of jarFiles) {
      if (/installer\.jar$/i.test(file)) continue
      if (
        /^(?:fabric|quilt)-server-launch\.jar$/i.test(file) ||
        /^server\.jar$/i.test(file) ||
        /^minecraft_server\.\d+\.\d+(?:\.\d+)?\.jar$/i.test(file) ||
        /^forge-\d+\.\d+(?:\.\d+)?-.*\.jar$/i.test(file) ||
        /^neoforge-[^-]+\.jar$/i.test(file)
      ) {
        candidates.push(file)
      }
    }
    if (!candidates.length) return null
    if (candidates.length === 1) return candidates[0]!
    const priority = [
      /fabric-server-launch\.jar$/i,
      /quilt-server-launch\.jar$/i,
      /^neoforge-/i,
      /^forge-/i,
      /^minecraft_server\./i,
      /^server\.jar$/i,
    ]
    for (const p of priority) {
      const found = candidates.find((c) => p.test(c))
      if (found) return found
    }
    return candidates[0]!
  } catch {
    return null
  }
}

const buildRunScripts = (serverJar: string): { bat: string; sh: string } => {
  const bat = `@echo off\nSETLOCAL ENABLEDELAYEDEXPANSION\nIF EXIST user_jvm_args.txt (\n  set JVM_ARGS=\n  for /f "usebackq delims=" %%a in ("user_jvm_args.txt") do set JVM_ARGS=!JVM_ARGS! %%a\n)\njava !JVM_ARGS! -jar "%~dp0${serverJar}" nogui\n`
  const sh = `#!/usr/bin/env bash\nset -euo pipefail\ncd "$(dirname "$0")"\nJAVA_ARGS=""\nif [[ -f user_jvm_args.txt ]]; then\n  JAVA_ARGS=$(tr '\n' ' ' < user_jvm_args.txt)\nfi\nexec java $JAVA_ARGS -jar "./${serverJar}" nogui\n`
  return { bat, sh }
}

const ensureRunScripts = async (
  serverJar: string
): Promise<{ created: boolean; updated: boolean }> => {
  let created = false
  let updated = false
  const { bat, sh } = buildRunScripts(serverJar)
  const batPath = path.join(CONFIG.MC_DIR, RUN_BAT)
  const shPath = path.join(CONFIG.MC_DIR, RUN_SH)

  const needsWrite = async (
    file: string,
    expected: string
  ): Promise<'create' | 'update' | 'skip'> => {
    try {
      const current = await fsp.readFile(file, 'utf8')
      if (current === expected) return 'skip'
      if (current.includes(serverJar)) return 'skip'
      return 'update'
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return 'create'
      return 'update'
    }
  }

  const batDecision = await needsWrite(batPath, bat)
  if (batDecision !== 'skip') {
    await fsp.writeFile(batPath, bat, 'utf8')
    if (batDecision === 'create') created = true
    else updated = true
  }
  const shDecision = await needsWrite(shPath, sh)
  if (shDecision !== 'skip') {
    await fsp.writeFile(shPath, sh, 'utf8')
    try {
      await fsp.chmod(shPath, 0o755)
    } catch {
      /* ignore on non-posix */
    }
    if (shDecision === 'create') created = true
    else updated = true
  }
  return { created, updated }
}

// Utility: parse versione Java corrente (java -version) e restituisce il major (8, 11, 17, 21, ...)
const getJavaMajor = async (): Promise<number | null> => {
  return new Promise((resolve) => {
    try {
      const ps = spawn(CONFIG.JAVA_BIN, ['-version'], { stdio: ['ignore', 'pipe', 'pipe'] })
      const chunks: Array<Buffer> = []
      const err: Array<Buffer> = []
      ps.stdout.on('data', (c) => chunks.push(Buffer.from(c)))
      ps.stderr.on('data', (c) => err.push(Buffer.from(c)))
      ps.on('error', () => resolve(null))
      ps.on('close', () => {
        const out = Buffer.concat(chunks).toString('utf8') + Buffer.concat(err).toString('utf8')
        const line = out.split('\n').find((l) => l.toLowerCase().includes('version'))
        if (!line) return resolve(null)
        const m = line.match(/version\s+"([^"]+)"/i)
        if (!m) return resolve(null)
        const raw = m[1]!
        // Formati possibili: 1.8.0_372 / 17.0.11 / 21 / 21.0.1 / 25-ea
        let major: number | null = null
        if (raw.startsWith('1.')) {
          const p = raw.split('.')
          ;(major as number | null) = p.length > 1 ? Number(p[1]) : null // 1.8 -> 8
        } else {
          const num = raw.match(/^(\d+)/)
          major = num ? Number(num[1]) : null
        }
        if (!major || Number.isNaN(major)) return resolve(null)
        resolve(major)
      })
    } catch {
      resolve(null)
    }
  })
}

const isLegacyMcVersion = (mcVersion: string | undefined): boolean => {
  if (!mcVersion) return false
  const m = mcVersion.match(/^1\.(\d+)/)
  if (!m) return false
  const minor = Number(m[1])
  return !Number.isNaN(minor) && minor < 17 // tutto <1.17 considerato legacy per le restrizioni java moderne
}

const buildJavaVersionWarning = (javaMajor: number, mcVersion: string, loader?: string): string => {
  const base = `Attenzione: stai usando Java ${javaMajor} per Minecraft ${mcVersion}${loader ? ' (' + loader + ')' : ''}.`
  // Raccomandazioni specifiche per Forge 1.16.x
  if (/^1\.16(\.|$)/.test(mcVersion) && loader === 'Forge') {
    return `${base} Forge 1.16.x è più stabile con Java 8 o 11 (accettabile fino a 17). Imposta una versione JAVA_BIN <= 17 (es: Java 17 LTS) o preferibilmente Java 8/11 per evitare IllegalAccessError.`
  }
  return `${base} Le versioni di Minecraft precedenti alla 1.17 possono avere incompatibilità con Java troppo recente. Usa Java 17 (LTS) oppure una versione precedente (8/11) per maggiore compatibilità.`
}

// Installazione di Vanilla Minecraft
const installVanilla = async (mcVersion: string, notes: string[]): Promise<void> => {
  try {
    const serverJar = path.join(CONFIG.MC_DIR, 'server.jar')
    // URL del server vanilla per la versione specifica
    const versionManifest = await fetch(
      'https://launchermeta.mojang.com/mc/game/version_manifest.json'
    )
    const manifest = await versionManifest.json()

    const versionInfo = manifest.versions.find((v: ManifestVersion) => v.id === mcVersion)
    if (!versionInfo) {
      throw new Error(`Versione Minecraft ${mcVersion} non trovata`)
    }

    const versionDetail = await fetch(versionInfo.url)
    const versionData = await versionDetail.json()

    if (!versionData.downloads?.server?.url) {
      throw new Error(`Server JAR non disponibile per la versione ${mcVersion}`)
    }

    const serverUrl = versionData.downloads.server.url
    await downloadToFile(serverUrl, serverJar)
    notes.push(`Scaricato server.jar per Minecraft ${mcVersion}`)
  } catch (e) {
    notes.push(`Errore installazione Vanilla: ${(e as Error).message}`)
    throw e
  }
}
// Installazione di Fabric
const installFabric = async (
  mcVersion: string,
  loaderVersion: string | undefined,
  notes: string[]
): Promise<void> => {
  const installerJar = path.join(CONFIG.MC_DIR, 'fabric-installer.jar')
  const url = 'https://maven.fabricmc.net/net/fabricmc/fabric-installer/latest/fabric-installer.jar'
  try {
    await downloadToFile(url, installerJar)
    notes.push('Scaricato fabric-installer.jar')

    const args = ['server', '-mcversion', mcVersion]
    if (loaderVersion && loaderVersion !== 'latest') {
      args.push('-loader', loaderVersion)
    }
    args.push('-downloadMinecraft')

    await runJavaJar(installerJar, args, CONFIG.MC_DIR)
    notes.push('Fabric server installato')
  } catch (e) {
    notes.push(`Errore installazione Fabric: ${(e as Error).message}`)
    throw e
  }
}

// Installazione di Forge
const installForge = async (
  mcVersion: string,
  forgeVersion: string,
  notes: string[]
): Promise<void> => {
  try {
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
const installNeoForge = async (neoForgeVersion: string, notes: string[]): Promise<void> => {
  try {
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
const installQuilt = async (
  mcVersion: string,
  loaderVersion: string | undefined,
  notes: string[]
): Promise<void> => {
  try {
    const installerJar = path.join(CONFIG.MC_DIR, 'quilt-installer.jar')
    const url =
      'https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-installer/latest/quilt-installer.jar'

    await downloadToFile(url, installerJar)
    notes.push('Scaricato quilt-installer.jar')

    const args = ['install', 'server', mcVersion]
    if (loaderVersion && loaderVersion !== 'latest') {
      args.push('--install-version', loaderVersion)
    }
    args.push('--download-server')

    await runJavaJar(installerJar, args, CONFIG.MC_DIR)
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
      } catch (_e) {
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
  const { fetchForgeVersions } = await import('./loader-apis.js')
  try {
    const { versions } = await fetchForgeVersions(mcVersion)
    // Prendi la versione latest o recommended
    const latest = versions.find((v) => v.latest || v.recommended)
    return latest?.version || versions[0]?.version || null
  } catch {
    // Fallback to static versions
    const staticVersions: Record<string, string> = {
      '1.21.1': '52.0.31',
      '1.21': '51.0.33',
      '1.20.1': '47.3.12',
      '1.19.2': '43.4.4',
      // Aggiunto supporto legacy
      '1.16.5': '36.2.39',
    }
    return staticVersions[mcVersion] || null
  }
}

const getLatestNeoForgeVersion = async (mcVersion: string): Promise<string | null> => {
  const { fetchNeoForgeVersions } = await import('./loader-apis.js')
  try {
    const { versions } = await fetchNeoForgeVersions(mcVersion)
    // Prendi la versione latest o recommended
    const latest = versions.find((v) => v.latest || v.recommended)
    return latest?.version || versions[0]?.version || null
  } catch {
    // Fallback to static versions
    const staticVersions: Record<string, string> = {
      '1.21.1': '21.1.200',
      '1.21': '21.0.207',
      '1.20.1': '20.1.241',
    }
    return staticVersions[mcVersion] || null
  }
}

// Tipo per le informazioni di versione
export type VersionInfo = {
  version: string
  stable: boolean
  recommended?: boolean
  latest?: boolean
}

// Cache in-memory per le versioni di Minecraft (solo release)
let cachedMinecraftVersions: string[] | null = null
let lastMinecraftVersionsFetch = 0
const MC_VERSIONS_TTL_MS = 60 * 60 * 1000 // 1h

const STATIC_FALLBACK_MINECRAFT_VERSIONS = [
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

// Recupera dinamicamente tutte le versioni "release" (esclude snapshot, old_beta, old_alpha)
// Ordine mantenuto come nel manifest Mojang (generalmente dalla più recente alla più vecchia)
const getMinecraftReleaseVersions = async (): Promise<string[]> => {
  const now = Date.now()
  if (cachedMinecraftVersions && now - lastMinecraftVersionsFetch < MC_VERSIONS_TTL_MS) {
    return cachedMinecraftVersions
  }
  try {
    const resp = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json')
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const manifest = (await resp.json()) as { versions: ManifestVersion[] }
    const releases = manifest.versions.filter((v) => v.type === 'release').map((v) => v.id)
    // Aggiorna cache solo se abbiamo ottenuto qualcosa
    if (releases.length) {
      cachedMinecraftVersions = releases
      lastMinecraftVersionsFetch = now
      return releases
    }
    return cachedMinecraftVersions ?? STATIC_FALLBACK_MINECRAFT_VERSIONS
  } catch {
    // Non aggiorniamo la cache su errore, così al prossimo giro si ritenta
    return cachedMinecraftVersions ?? STATIC_FALLBACK_MINECRAFT_VERSIONS
  }
}

// Cache per versioni dei loader per evitare chiamate ripetute pesanti
type LoaderName = 'Fabric' | 'Forge' | 'NeoForge' | 'Quilt'
const loaderVersionsCache: Record<LoaderName, Map<string, VersionInfo[]>> = {
  Fabric: new Map(),
  Forge: new Map(),
  NeoForge: new Map(),
  Quilt: new Map(),
}
let lastLoaderFetch = 0
const LOADER_VERSIONS_TTL_MS = 30 * 60 * 1000 // 30 minuti

const getCachedOrFetchLoader = async (
  loader: LoaderName,
  mcVersion: string,
  fetcher: (mc: string) => Promise<{ versions: VersionInfo[] }>,
  fallback?: VersionInfo[]
): Promise<VersionInfo[] | null> => {
  const now = Date.now()
  const cache = loaderVersionsCache[loader]
  const stale = now - lastLoaderFetch > LOADER_VERSIONS_TTL_MS
  if (!stale && cache.has(mcVersion)) return cache.get(mcVersion) || null
  try {
    const { versions } = await fetcher(mcVersion)
    if (versions?.length) {
      cache.set(mcVersion, versions)
      lastLoaderFetch = now
      return versions
    }
  } catch {
    if (fallback?.length) {
      cache.set(mcVersion, fallback)
      return fallback
    }
  }
  return null
}

// Export granular API per caricamento chunked
export const getMinecraftVersions = async (): Promise<string[]> => {
  return getMinecraftReleaseVersions()
}

export const getLoaderVersions = async (
  loader: 'Vanilla' | 'Fabric' | 'Forge' | 'NeoForge' | 'Quilt',
  mcVersion: string
): Promise<VersionInfo[]> => {
  const {
    getVanillaVersions,
    fetchFabricVersions,
    fetchForgeVersions,
    fetchNeoForgeVersions,
    fetchQuiltVersions,
  } = await import('./loader-apis.js')
  if (loader === 'Vanilla') {
    try {
      return getVanillaVersions(mcVersion).versions
    } catch {
      return [{ version: mcVersion, stable: true, latest: true }]
    }
  }
  if (loader === 'Fabric') {
    return (
      (await getCachedOrFetchLoader('Fabric', mcVersion, fetchFabricVersions, [
        { version: 'latest', stable: true, latest: true },
      ])) || []
    )
  }
  if (loader === 'Forge') {
    const forgeFallbackMap: Record<string, string> = {
      '1.21.1': '52.0.31',
      '1.21': '51.0.33',
      '1.20.1': '47.3.12',
      '1.19.2': '43.4.4',
      '1.16.5': '36.2.39',
    }
    return (
      (await getCachedOrFetchLoader(
        'Forge',
        mcVersion,
        fetchForgeVersions,
        forgeFallbackMap[mcVersion]
          ? [{ version: forgeFallbackMap[mcVersion]!, stable: true, latest: true }]
          : undefined
      )) || []
    )
  }
  if (loader === 'NeoForge') {
    const neoForgeFallbackMap: Record<string, string> = {
      '1.21.1': '21.1.200',
      '1.21': '21.0.207',
      '1.20.1': '20.1.241',
    }
    return (
      (await getCachedOrFetchLoader(
        'NeoForge',
        mcVersion,
        fetchNeoForgeVersions,
        neoForgeFallbackMap[mcVersion]
          ? [{ version: neoForgeFallbackMap[mcVersion]!, stable: true, latest: true }]
          : undefined
      )) || []
    )
  }
  if (loader === 'Quilt') {
    return (
      (await getCachedOrFetchLoader('Quilt', mcVersion, fetchQuiltVersions, [
        { version: 'latest', stable: true, latest: true },
      ])) || []
    )
  }
  return []
}

// Funzione per ottenere tutte le versioni supportate
export const getSupportedVersions = async (): Promise<{
  minecraft: string[]
  loaders: Record<string, { label: string; versions: Record<string, VersionInfo[]> }>
}> => {
  // Ottiene dinamicamente tutte le versioni release (no snapshot)
  const minecraftVersions = await getMinecraftReleaseVersions()

  const {
    getVanillaVersions,
    fetchFabricVersions,
    fetchForgeVersions,
    fetchNeoForgeVersions,
    fetchQuiltVersions,
  } = await import('./loader-apis.js')

  // Costruisce le versioni per ogni loader
  const loaders: Record<string, { label: string; versions: Record<string, VersionInfo[]> }> = {
    Vanilla: {
      label: 'Vanilla',
      versions: {},
    },
    Fabric: {
      label: 'Fabric',
      versions: {},
    },
    Forge: {
      label: 'Forge',
      versions: {},
    },
    NeoForge: {
      label: 'NeoForge',
      versions: {},
    },
    Quilt: {
      label: 'Quilt',
      versions: {},
    },
  }

  // Popola le versioni per ogni MC version
  for (const mcVersion of minecraftVersions) {
    // Vanilla sempre: se la funzione non ha dati per versioni antiche, gestisci fallback interno
    try {
      loaders.Vanilla!.versions[mcVersion] = getVanillaVersions(mcVersion).versions
    } catch {
      // Se dovesse fallire (improbabile) assegna placeholder
      loaders.Vanilla!.versions[mcVersion] = [{ version: mcVersion, stable: true, latest: true }]
    }

    // Fabric dinamico
    const fabricVersions = await getCachedOrFetchLoader('Fabric', mcVersion, fetchFabricVersions, [
      { version: 'latest', stable: true, latest: true },
    ])
    if (fabricVersions) loaders.Fabric!.versions[mcVersion] = fabricVersions

    // Forge dinamico (fallback singola versione se nota)
    const forgeFallbackMap: Record<string, string> = {
      '1.21.1': '52.0.31',
      '1.21': '51.0.33',
      '1.20.1': '47.3.12',
      '1.19.2': '43.4.4',
      '1.16.5': '36.2.39',
    }
    const forgeVersions = await getCachedOrFetchLoader(
      'Forge',
      mcVersion,
      fetchForgeVersions,
      forgeFallbackMap[mcVersion]
        ? [{ version: forgeFallbackMap[mcVersion]!, stable: true, latest: true }]
        : undefined
    )
    if (forgeVersions) loaders.Forge!.versions[mcVersion] = forgeVersions

    // NeoForge dinamico
    const neoForgeFallbackMap: Record<string, string> = {
      '1.21.1': '21.1.200',
      '1.21': '21.0.207',
      '1.20.1': '20.1.241',
    }
    const neoVersions = await getCachedOrFetchLoader(
      'NeoForge',
      mcVersion,
      fetchNeoForgeVersions,
      neoForgeFallbackMap[mcVersion]
        ? [{ version: neoForgeFallbackMap[mcVersion]!, stable: true, latest: true }]
        : undefined
    )
    if (neoVersions) loaders.NeoForge!.versions[mcVersion] = neoVersions

    // Quilt dinamico
    const quiltVersions = await getCachedOrFetchLoader('Quilt', mcVersion, fetchQuiltVersions, [
      { version: 'latest', stable: true, latest: true },
    ])
    if (quiltVersions) loaders.Quilt!.versions[mcVersion] = quiltVersions
  }

  return { minecraft: minecraftVersions, loaders }
}

export const installModpack = async (
  req: InstallRequest
): Promise<{ ok: true; notes: string[] }> => {
  const notes: string[] = []
  // Conserva la versione del loader rilevata per salvarla a fine installazione
  let loaderVersion: string | undefined = req.loaderVersion

  if (req.mode === 'automatic') {
    if (!req.loader || !req.mcVersion) {
      throw new Error('Loader e versione MC sono richiesti per modalità automatica')
    }
    notes.push(`Modalità automatica: loader=${req.loader} mc=${req.mcVersion}`)
    await ensureEula()
    await writeJvmArgs()
    await fsp.mkdir(CONFIG.MC_DIR, { recursive: true })

    // Determina la versione del loader (se applicabile)

    if (req.loader === 'Vanilla') {
      await installVanilla(req.mcVersion, notes)
      loaderVersion = req.mcVersion
    } else if (req.loader === 'Fabric') {
      await installFabric(req.mcVersion, loaderVersion, notes)
      loaderVersion = loaderVersion || 'latest'
    } else if (req.loader === 'Forge') {
      if (!loaderVersion) {
        loaderVersion = (await getLatestForgeVersion(req.mcVersion)) || undefined
      }
      if (!loaderVersion) {
        throw new Error(`Versione Forge non trovata per MC ${req.mcVersion}`)
      }
      await installForge(req.mcVersion, loaderVersion, notes)
    } else if (req.loader === 'NeoForge') {
      if (!loaderVersion) {
        loaderVersion = (await getLatestNeoForgeVersion(req.mcVersion)) || undefined
      }
      if (!loaderVersion) {
        throw new Error(`Versione NeoForge non trovata per MC ${req.mcVersion}`)
      }
      await installNeoForge(loaderVersion, notes)
    } else if (req.loader === 'Quilt') {
      await installQuilt(req.mcVersion, loaderVersion, notes)
      loaderVersion = loaderVersion || 'latest'
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

  // Salva le informazioni dell'installazione per la detection del tipo
  if (req.mode === 'automatic' && req.loader) {
    const info: { mode: string; loader?: string; loaderVersion?: string; mcVersion?: string } = {
      mode: req.mode,
      loader: req.loader,
    }
    if (loaderVersion) info.loaderVersion = loaderVersion
    if (req.mcVersion) info.mcVersion = req.mcVersion
    await saveInstallationInfo(info)
    await saveLastInstalledToDb(info)
  }

  // Genera/aggiorna script di avvio
  try {
    const detected = await detectServerLaunchJar()
    if (detected) {
      const { created, updated } = await ensureRunScripts(detected)
      if (created) notes.push(`Creati script di avvio per ${detected}`)
      else if (updated) notes.push(`Aggiornati script di avvio per ${detected}`)
      else notes.push(`Script di avvio già presenti per ${detected}`)
    } else {
      notes.push('Impossibile rilevare il JAR server finale per creare run.sh/run.bat')
    }
  } catch (e) {
    notes.push(`Errore generazione script di avvio: ${(e as Error).message}`)
  }

  // Warning su versione Java troppo nuova per versioni legacy
  if (req.mcVersion && isLegacyMcVersion(req.mcVersion)) {
    const javaMajor = await getJavaMajor()
    if (javaMajor && javaMajor > 17) {
      notes.push(buildJavaVersionWarning(javaMajor, req.mcVersion, req.loader))
    }
  }

  return { ok: true, notes }
}

type WebSocketLike = {
  send: (data: string) => void
  close: () => void
}

// Versione con WebSocket per progresso real-time
export const installModpackWithProgress = async (
  req: InstallRequest,
  ws: WebSocketLike
): Promise<void> => {
  const sendProgress = (message: string) => {
    try {
      ws.send(JSON.stringify({ type: 'progress', data: message }))
    } catch {
      // ignore if websocket is closed
    }
  }

  const sendComplete = (message: string) => {
    try {
      ws.send(JSON.stringify({ type: 'complete', data: message }))
    } catch {
      // ignore if websocket is closed
    }
  }

  const sendError = (message: string) => {
    try {
      ws.send(JSON.stringify({ type: 'error', data: message }))
    } catch {
      // ignore if websocket is closed
    }
  }

  try {
    // Conserva la versione del loader rilevata per salvarla a fine installazione
    let loaderVersion: string | undefined = req.loaderVersion

    if (req.mode === 'automatic') {
      if (!req.loader || !req.mcVersion) {
        throw new Error('Loader e versione MC sono richiesti per modalità automatica')
      }
      sendProgress(`Modalità automatica: loader=${req.loader} mc=${req.mcVersion}`)

      // Determina la versione del loader (se applicabile)

      sendProgress('Preparazione directory server...')
      await ensureEula()
      await writeJvmArgs()
      await fsp.mkdir(CONFIG.MC_DIR, { recursive: true })

      if (req.loader === 'Vanilla') {
        await installVanillaWithProgress(req.mcVersion, sendProgress)
        loaderVersion = req.mcVersion
      } else if (req.loader === 'Fabric') {
        await installFabricWithProgress(req.mcVersion, loaderVersion, sendProgress)
        loaderVersion = loaderVersion || 'latest'
      } else if (req.loader === 'Forge') {
        if (!loaderVersion) {
          sendProgress('Ricerca versione Forge...')
          loaderVersion = (await getLatestForgeVersion(req.mcVersion)) || undefined
        }
        if (!loaderVersion) {
          throw new Error(`Versione Forge non trovata per MC ${req.mcVersion}`)
        }
        await installForgeWithProgress(req.mcVersion, loaderVersion, sendProgress)
      } else if (req.loader === 'NeoForge') {
        if (!loaderVersion) {
          sendProgress('Ricerca versione NeoForge...')
          loaderVersion = (await getLatestNeoForgeVersion(req.mcVersion)) || undefined
        }
        if (!loaderVersion) {
          throw new Error(`Versione NeoForge non trovata per MC ${req.mcVersion}`)
        }
        await installNeoForgeWithProgress(loaderVersion, sendProgress)
      } else if (req.loader === 'Quilt') {
        await installQuiltWithProgress(req.mcVersion, loaderVersion, sendProgress)
        loaderVersion = loaderVersion || 'latest'
      }
    } else if (req.mode === 'manual') {
      if (!req.jarFileName) {
        throw new Error('Nome del file JAR è richiesto per modalità manuale')
      }
      sendProgress(`Modalità manuale: jar=${req.jarFileName}`)

      sendProgress('Preparazione directory server...')
      await ensureEula()
      await writeJvmArgs()
      await installFromCustomJarWithProgress(req.jarFileName, sendProgress)
    }

    sendProgress('EULA e JVM args configurati.')

    // Salva le informazioni dell'installazione per la detection del tipo
    if (req.mode === 'automatic' && req.loader) {
      const info: { mode: string; loader?: string; loaderVersion?: string; mcVersion?: string } = {
        mode: req.mode,
        loader: req.loader,
      }
      if (loaderVersion) info.loaderVersion = loaderVersion
      if (req.mcVersion) info.mcVersion = req.mcVersion
      await saveInstallationInfo(info)
      await saveLastInstalledToDb(info)
    }

    // Rileva jar e genera script (versione con progress)
    try {
      sendProgress('Rilevazione JAR server finale...')
      const detected = await detectServerLaunchJar()
      if (detected) {
        const { created, updated } = await ensureRunScripts(detected)
        if (created) sendProgress(`Creati script di avvio per ${detected}`)
        else if (updated) sendProgress(`Aggiornati script di avvio per ${detected}`)
        else sendProgress(`Script di avvio già presenti per ${detected}`)
      } else {
        sendProgress('⚠️ Impossibile rilevare il JAR server finale per generare gli script')
      }
    } catch (e) {
      sendProgress(`Errore generazione script di avvio: ${(e as Error).message}`)
    }

    if (req.mcVersion && isLegacyMcVersion(req.mcVersion)) {
      const javaMajor = await getJavaMajor()
      if (javaMajor && javaMajor > 17) {
        sendProgress(buildJavaVersionWarning(javaMajor, req.mcVersion, req.loader))
      }
    }

    sendComplete('✅ Installazione modpack completata con successo!')
  } catch (error) {
    sendError((error as Error).message)
  }
}

// Versioni con progresso per le funzioni di installazione
const installVanillaWithProgress = async (
  mcVersion: string,
  sendProgress: (msg: string) => void
): Promise<void> => {
  try {
    const serverJar = path.join(CONFIG.MC_DIR, 'server.jar')

    sendProgress('Ricerca versione Vanilla...')
    const versionManifest = await fetch(
      'https://launchermeta.mojang.com/mc/game/version_manifest.json'
    )
    const manifest = await versionManifest.json()

    const versionInfo = manifest.versions.find((v: ManifestVersion) => v.id === mcVersion)
    if (!versionInfo) {
      throw new Error(`Versione Minecraft ${mcVersion} non trovata`)
    }

    sendProgress('Download informazioni versione...')
    const versionDetail = await fetch(versionInfo.url)
    const versionData = await versionDetail.json()

    if (!versionData.downloads?.server?.url) {
      throw new Error(`Server JAR non disponibile per la versione ${mcVersion}`)
    }

    sendProgress('Download server vanilla...')
    const serverUrl = versionData.downloads.server.url
    await downloadToFile(serverUrl, serverJar)
    sendProgress(`Scaricato server.jar per Minecraft ${mcVersion}`)
  } catch (e) {
    sendProgress(`Errore installazione Vanilla: ${(e as Error).message}`)
    throw e
  }
}

const installFabricWithProgress = async (
  mcVersion: string,
  loaderVersion: string | undefined,
  sendProgress: (msg: string) => void
): Promise<void> => {
  const installerJar = path.join(CONFIG.MC_DIR, 'fabric-installer.jar')
  const url = 'https://maven.fabricmc.net/net/fabricmc/fabric-installer/latest/fabric-installer.jar'
  try {
    sendProgress('Download Fabric installer...')
    await downloadToFile(url, installerJar)
    sendProgress('Scaricato fabric-installer.jar')

    sendProgress('Installazione Fabric server...')
    const args = ['server', '-mcversion', mcVersion]
    if (loaderVersion && loaderVersion !== 'latest') {
      args.push('-loader', loaderVersion)
    }
    args.push('-downloadMinecraft')

    await runJavaJar(installerJar, args, CONFIG.MC_DIR)
    sendProgress('Fabric server installato')
  } catch (e) {
    sendProgress(`Errore installazione Fabric: ${(e as Error).message}`)
    throw e
  }
}

const installForgeWithProgress = async (
  mcVersion: string,
  forgeVersion: string,
  sendProgress: (msg: string) => void
): Promise<void> => {
  try {
    const fileName = `forge-${mcVersion}-${forgeVersion}-installer.jar`
    const installerJar = path.join(CONFIG.MC_DIR, fileName)
    const url = `https://maven.minecraftforge.net/net/minecraftforge/forge/${mcVersion}-${forgeVersion}/forge-${mcVersion}-${forgeVersion}-installer.jar`

    sendProgress('Download Forge installer...')
    await downloadToFile(url, installerJar)
    sendProgress(`Scaricato ${fileName}`)

    sendProgress('Installazione Forge server...')
    await runJavaJar(installerJar, ['--installServer'], CONFIG.MC_DIR)
    sendProgress('Forge server installato')
  } catch (e) {
    sendProgress(`Errore installazione Forge: ${(e as Error).message}`)
    throw e
  }
}

const installNeoForgeWithProgress = async (
  neoForgeVersion: string,
  sendProgress: (msg: string) => void
): Promise<void> => {
  try {
    const fileName = `neoforge-${neoForgeVersion}-installer.jar`
    const installerJar = path.join(CONFIG.MC_DIR, fileName)
    const url = `https://maven.neoforged.net/net/neoforged/neoforge/${neoForgeVersion}/neoforge-${neoForgeVersion}-installer.jar`

    sendProgress('Download NeoForge installer...')
    await downloadToFile(url, installerJar)
    sendProgress(`Scaricato ${fileName}`)

    sendProgress('Installazione NeoForge server...')
    await runJavaJar(installerJar, ['--installServer'], CONFIG.MC_DIR)
    sendProgress('NeoForge server installato')
  } catch (e) {
    sendProgress(`Errore installazione NeoForge: ${(e as Error).message}`)
    throw e
  }
}

const installQuiltWithProgress = async (
  mcVersion: string,
  loaderVersion: string | undefined,
  sendProgress: (msg: string) => void
): Promise<void> => {
  try {
    const installerJar = path.join(CONFIG.MC_DIR, 'quilt-installer.jar')
    const url =
      'https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-installer/latest/quilt-installer.jar'

    sendProgress('Download Quilt installer...')
    await downloadToFile(url, installerJar)
    sendProgress('Scaricato quilt-installer.jar')

    sendProgress('Installazione Quilt server...')
    const args = ['install', 'server', mcVersion]
    if (loaderVersion && loaderVersion !== 'latest') {
      args.push('--install-version', loaderVersion)
    }
    args.push('--download-server')

    await runJavaJar(installerJar, args, CONFIG.MC_DIR)
    sendProgress('Quilt server installato')
  } catch (e) {
    sendProgress(`Errore installazione Quilt: ${(e as Error).message}`)
    throw e
  }
}

const installFromCustomJarWithProgress = async (
  jarFileName: string,
  sendProgress: (msg: string) => void
): Promise<void> => {
  const jarPath = path.join(CONFIG.MC_DIR, jarFileName)
  try {
    sendProgress('Verifica JAR personalizzato...')
    await fsp.access(jarPath)
    sendProgress(`Trovato JAR personalizzato: ${jarFileName}`)

    const commonArgs = ['--installServer', 'install server', 'server']
    let installed = false

    for (const args of commonArgs) {
      try {
        sendProgress(`Tentativo installazione con argomenti: ${args}`)
        await runJavaJar(jarPath, args.split(' '), CONFIG.MC_DIR)
        sendProgress(`Installato usando argomenti: ${args}`)
        installed = true
        break
      } catch (_e) {
        sendProgress(`Tentativo con argomenti '${args}' fallito`)
      }
    }

    if (!installed) {
      throw new Error('Nessun metodo di installazione standard ha funzionato')
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`File ${jarFileName} non trovato nella directory del server`)
    }
    sendProgress(`Errore installazione JAR personalizzato: ${(e as Error).message}`)
    throw e
  }
}
