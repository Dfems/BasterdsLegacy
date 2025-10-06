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
