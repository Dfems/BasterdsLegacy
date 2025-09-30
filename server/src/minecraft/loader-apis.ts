// API clients for fetching modloader versions dynamically

type VersionInfo = {
  version: string
  stable: boolean
  recommended?: boolean
  latest?: boolean
}

type LoaderVersions = {
  versions: VersionInfo[]
}

// Fabric API client
export const fetchFabricVersions = async (mcVersion: string): Promise<LoaderVersions> => {
  try {
    const response = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${mcVersion}`)
    if (!response.ok) {
      throw new Error(`Fabric API error: ${response.status}`)
    }
    const data = await response.json()

    // Fabric API returns array of objects with loader info
    const versions: VersionInfo[] = data.map(
      (item: { loader: { version: string; stable: boolean } }, index: number) => ({
        version: item.loader.version,
        stable: item.loader.stable,
        latest: index === 0,
        recommended: index === 0 && item.loader.stable,
      })
    )

    return { versions }
  } catch (error) {
    console.error('Error fetching Fabric versions:', error)
    // Fallback to static versions if API fails
    return {
      versions: [{ version: 'latest', stable: true, recommended: true, latest: true }],
    }
  }
}

// Quilt API client
export const fetchQuiltVersions = async (mcVersion: string): Promise<LoaderVersions> => {
  try {
    const response = await fetch(`https://meta.quiltmc.org/v3/versions/loader/${mcVersion}`)
    if (!response.ok) {
      throw new Error(`Quilt API error: ${response.status}`)
    }
    const data = await response.json()

    // Quilt API similar to Fabric
    const versions: VersionInfo[] = data.map(
      (item: { loader: { version: string } }, index: number) => ({
        version: item.loader.version,
        stable: true, // Quilt generally marks all as stable
        latest: index === 0,
        recommended: index === 0,
      })
    )

    return { versions }
  } catch (error) {
    console.error('Error fetching Quilt versions:', error)
    return {
      versions: [{ version: 'latest', stable: true, recommended: true, latest: true }],
    }
  }
}

// Forge API client
export const fetchForgeVersions = async (mcVersion: string): Promise<LoaderVersions> => {
  try {
    // First, get promotions to identify recommended/latest versions
    const promoResponse = await fetch(
      'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json'
    )
    const promoData = await promoResponse.json()

    const latestKey = `${mcVersion}-latest`
    const recommendedKey = `${mcVersion}-recommended`

    const latestVersion = promoData.promos?.[latestKey]
    const recommendedVersion = promoData.promos?.[recommendedKey]

    // Fetch all versions from maven metadata
    const metaResponse = await fetch(
      `https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml`
    )
    const metaText = await metaResponse.text()

    // Parse XML to extract versions for this MC version
    const versionPattern = new RegExp(`${mcVersion.replace('.', '\\.')}-([\\d.]+)`, 'g')
    const matches = [...metaText.matchAll(versionPattern)]
    const forgeVersions = [...new Set(matches.map((m) => m[1]!))]

    const versions: VersionInfo[] = forgeVersions.map((version) => ({
      version,
      stable: true,
      recommended: version === recommendedVersion,
      latest: version === latestVersion,
    }))

    // Sort by version number (descending)
    versions.sort((a, b) => {
      const aParts = a.version.split('.').map(Number)
      const bParts = b.version.split('.').map(Number)
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = aParts[i] || 0
        const bVal = bParts[i] || 0
        if (aVal !== bVal) return bVal - aVal
      }
      return 0
    })

    return {
      versions:
        versions.length > 0
          ? versions
          : [{ version: '52.0.31', stable: true, recommended: true, latest: true }],
    }
  } catch (error) {
    console.error('Error fetching Forge versions:', error)
    // Fallback to static versions
    const staticVersions: Record<string, string> = {
      '1.21.1': '52.0.31',
      '1.21': '51.0.33',
      '1.20.1': '47.3.12',
      '1.19.2': '43.4.4',
    }
    const version = staticVersions[mcVersion]
    return {
      versions: version ? [{ version, stable: true, recommended: true, latest: true }] : [],
    }
  }
}

// NeoForge API client
export const fetchNeoForgeVersions = async (mcVersion: string): Promise<LoaderVersions> => {
  try {
    // NeoForge uses a different versioning scheme - version contains MC version
    const response = await fetch(
      'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge'
    )
    if (!response.ok) {
      throw new Error(`NeoForge API error: ${response.status}`)
    }
    const data = await response.json()

    // Filter versions that match the MC version
    const mcVersionPrefix = mcVersion.replace(/\./g, '.')
    const filteredVersions = (data.versions || []).filter((v: string) => {
      // NeoForge versions are like 21.1.200 for MC 1.21.1
      // Extract MC version from NeoForge version
      const parts = v.split('.')
      if (parts.length >= 2) {
        const neoMcVersion = `1.${parts[0]}.${parts[1]}`
        return neoMcVersion === mcVersion || v.startsWith(mcVersionPrefix)
      }
      return false
    })

    const versions: VersionInfo[] = filteredVersions.map((version: string, index: number) => ({
      version,
      stable: true,
      latest: index === 0,
      recommended: index === 0,
    }))

    return {
      versions:
        versions.length > 0
          ? versions
          : [{ version: '21.1.200', stable: true, recommended: true, latest: true }],
    }
  } catch (error) {
    console.error('Error fetching NeoForge versions:', error)
    // Fallback to static versions
    const staticVersions: Record<string, string> = {
      '1.21.1': '21.1.200',
      '1.21': '21.0.207',
      '1.20.1': '20.1.241',
    }
    const version = staticVersions[mcVersion]
    return {
      versions: version ? [{ version, stable: true, recommended: true, latest: true }] : [],
    }
  }
}

// Vanilla doesn't need API - versions are the same as MC version
export const getVanillaVersions = (mcVersion: string): LoaderVersions => {
  return {
    versions: [{ version: mcVersion, stable: true, recommended: true, latest: true }],
  }
}
