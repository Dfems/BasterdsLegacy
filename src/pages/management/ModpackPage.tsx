import { useMemo, useState, type JSX } from 'react'

import { Badge, Box, Grid, HStack, Input, Text, Textarea, VStack } from '@chakra-ui/react'

import { GlassButton } from '@/shared/components/GlassButton'
import { ModernHeader } from '@/shared/components/ModernHeader'
import { QuickActionCard } from '@/shared/components/QuickActionCard'
import { SimpleSelect } from '@/shared/components/SimpleSelect'
import { StatusIndicator } from '@/shared/components/StatusIndicator'
import useLanguage from '@/shared/hooks/useLanguage'
import { useModpackInstallProgress } from '@/shared/hooks/useModpackInstallProgress'
import { useModpackVersions } from '@/shared/hooks/useModpackVersions'
import { useServerJarStatus } from '@/shared/hooks/useServerJarStatus'

type InstallMode = 'automatic' | 'manual'
type LoaderType = 'Vanilla' | 'Fabric' | 'Forge' | 'Quilt' | 'NeoForge'

export default function ModpackPage(): JSX.Element {
  const { modpack, common, home } = useLanguage()
  const [installMode, setInstallMode] = useState<InstallMode>('automatic')
  const [loader, setLoader] = useState<LoaderType>('Vanilla')
  const [mcVersion, setMcVersion] = useState('1.21.1')
  const [loaderVersion, setLoaderVersion] = useState<string>('')
  const [jarFileName, setJarFileName] = useState('')
  const [busy, setBusy] = useState(false)

  const {
    data: versionData,
    isLoading: versionsLoading,
    error: versionsError,
  } = useModpackVersions()

  const { data: jarStatus } = useServerJarStatus()
  const { progress, connectWebSocket, sendInstallMessage, resetProgress } =
    useModpackInstallProgress(setBusy)

  // Opzioni dinamiche per le versioni Minecraft
  const mcVersionOptions = useMemo(() => {
    if (!versionData) return [{ value: '1.21.1', label: '1.21.1' }]
    return versionData.minecraft.map((v) => ({ value: v, label: v }))
  }, [versionData])

  // Opzioni dinamiche per le versioni del loader
  const loaderVersionOptions = useMemo(() => {
    if (!versionData) return []
    const loaderInfo = versionData.loaders[loader]
    const supported = loaderInfo && mcVersion in loaderInfo.versions
    if (!supported) return []
    const versions = loaderInfo.versions[mcVersion] || []

    return versions.map((v) => {
      let label = v.version
      const badges = []
      if (v.recommended) badges.push('★')
      if (v.latest) badges.push('Latest')
      if (!v.stable) badges.push('Beta')
      if (badges.length > 0) {
        label = `${v.version} ${badges.map((b) => `[${b}]`).join(' ')}`
      }
      return { value: v.version, label }
    })
  }, [versionData, loader, mcVersion])

  // Verifica se la versione selezionata è supportata dal loader corrente
  const isVersionSupported = useMemo(() => {
    if (!versionData) return true
    const loaderInfo = versionData.loaders[loader]
    return loaderInfo && mcVersion in loaderInfo.versions
  }, [versionData, loader, mcVersion])

  // Reset della versione del loader quando cambia loader o MC version
  useMemo(() => {
    if (loaderVersionOptions.length > 0) {
      // Seleziona la prima versione (generalmente latest/recommended)
      setLoaderVersion(loaderVersionOptions[0]?.value || '')
    } else {
      setLoaderVersion('')
    }
  }, [loaderVersionOptions])

  const runInstall = async () => {
    setBusy(true)
    resetProgress()

    try {
      const payload =
        installMode === 'automatic'
          ? { loader, mcVersion, loaderVersion: loaderVersion || undefined, mode: 'automatic' }
          : { jarFileName, mode: 'manual' }

      // Connetti al WebSocket per il progresso real-time
      connectWebSocket()

      // Aspetta un momento per permettere la connessione WebSocket
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Invia il messaggio di installazione tramite l'hook WebSocket
      sendInstallMessage(payload)
    } catch {
      // Se c'è un errore qui, resetta e riattiva il pulsante
      resetProgress()
      setBusy(false)
    }
  }

  const isInstallDisabled = () => {
    if (busy || versionsLoading) return true
    if (installMode === 'automatic') {
      return !loader || !mcVersion || !isVersionSupported
    }
    return !jarFileName.trim()
  }

  return (
    <Box>
      {/* Modern Header with stunning animations and gradients */}
      <ModernHeader
        title={`📦 ${modpack.managementTitle ?? modpack.title}`}
        description={modpack.metaConfigDescription}
        emoji="⚙️"
      />

      <Box p={{ base: 4, md: 6 }}>
        <VStack gap={6} align="stretch">
          {/* Current Modpack Status */}
          {jarStatus && (
            <QuickActionCard
              inset
              title={`📦 ${home.loggedIn.currentModpack?.replace(
                '{name}',
                jarStatus?.hasJar ? (jarStatus.jarName ?? '-') : home.loggedIn.modpackNotFound
              )}`}
              description={home.loggedIn.systemInfo}
              icon="ℹ️"
              gradient="linear(to-r, blue.400, cyan.500)"
            >
              <VStack gap={3} align="stretch">
                <HStack gap={3} align="center" wrap="wrap">
                  <StatusIndicator
                    status={jarStatus.hasJar ? 'online' : 'offline'}
                    label={
                      jarStatus.hasJar
                        ? home.loggedIn.modpackInstalled
                        : home.loggedIn.modpackNotFound
                    }
                  />
                  <Badge colorPalette={jarStatus.hasJar ? 'green' : 'orange'} variant="solid">
                    {jarStatus?.hasJar
                      ? home.loggedIn.modpackInstalled
                      : home.loggedIn.modpackNotFound}
                  </Badge>
                </HStack>
                {jarStatus.hasJar && jarStatus.jarName && (
                  <VStack align="stretch" gap={2}>
                    <Text fontSize="sm" color="textMuted">
                      {modpack.jarFileName}
                    </Text>
                    <Text fontSize="md" fontWeight="bold" color="brand.primary">
                      📄 {jarStatus.jarName}
                    </Text>
                    {jarStatus.jarType && (
                      <Badge colorPalette="blue" variant="outline" alignSelf="start">
                        {jarStatus.jarType.toUpperCase()}
                      </Badge>
                    )}
                  </VStack>
                )}
              </VStack>
            </QuickActionCard>
          )}

          {/* Error State */}
          {versionsError && (
            <QuickActionCard
              title={`⚠️ ${common.error}`}
              description={modpack.errorVersions.replace(
                '{error}',
                (versionsError as Error).message
              )}
              icon="❌"
              gradient="linear(to-r, red.400, orange.500)"
            >
              <VStack gap={3}>
                <StatusIndicator status="error" label={common.error} />
              </VStack>
            </QuickActionCard>
          )}

          {/* Installation Mode Selection */}
          <QuickActionCard
            inset
            title={`🛠️ ${modpack.mode}`}
            description={modpack.installSectionDescription ?? modpack.installPrompt}
            icon="⚙️"
            gradient="linear(to-r, purple.400, pink.500)"
          >
            <VStack gap={4} align="stretch">
              <HStack gap={3} wrap="wrap">
                <Text
                  minWidth="fit-content"
                  fontSize={{ base: 'sm', md: 'md' }}
                  fontWeight="medium"
                >
                  {modpack.mode}:
                </Text>
                <SimpleSelect
                  value={installMode}
                  onChange={(v) => setInstallMode(v as InstallMode)}
                  options={[
                    { value: 'automatic', label: modpack.automatic },
                    { value: 'manual', label: modpack.manual },
                  ]}
                />
              </HStack>

              {/* Configurazione per modalità automatica */}
              {installMode === 'automatic' && (
                <VStack gap={3} align="stretch">
                  <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
                    <Box>
                      <Text fontSize="sm" color="textMuted" mb={1}>
                        {common.loader}
                      </Text>
                      <SimpleSelect
                        value={loader}
                        onChange={(v) => setLoader(v as LoaderType)}
                        options={[
                          { value: 'Vanilla', label: 'Vanilla' },
                          { value: 'Fabric', label: 'Fabric' },
                          { value: 'Forge', label: 'Forge' },
                          { value: 'Quilt', label: 'Quilt' },
                          { value: 'NeoForge', label: 'NeoForge' },
                        ]}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="textMuted" mb={1}>
                        {modpack.mcVersion}
                      </Text>
                      <SimpleSelect
                        value={mcVersion}
                        onChange={(v) => setMcVersion(v)}
                        options={mcVersionOptions}
                      />
                    </Box>
                  </Grid>

                  {/* Loader Version Selector - only show if there are multiple versions */}
                  {isVersionSupported && loaderVersionOptions.length > 0 && (
                    <Box>
                      <Text fontSize="sm" color="textMuted" mb={1}>
                        {modpack.loaderVersion || `${loader} Version`}
                      </Text>
                      <SimpleSelect
                        value={loaderVersion}
                        onChange={(v) => setLoaderVersion(v)}
                        options={loaderVersionOptions}
                      />
                    </Box>
                  )}

                  {!isVersionSupported && (
                    <HStack gap={2}>
                      <StatusIndicator status="warning" label="Versione non supportata" />
                      <Text fontSize="sm" color="orange.400">
                        {modpack.versionUnsupported
                          .replace('{version}', mcVersion)
                          .replace('{loader}', loader)}
                      </Text>
                    </HStack>
                  )}

                  {versionData && isVersionSupported && loaderVersionOptions.length > 0 && (
                    <VStack align="stretch" gap={2}>
                      <HStack gap={2}>
                        <StatusIndicator status="online" label="Versione supportata" />
                        <Text fontSize="sm" color="green.400">
                          {loaderVersionOptions.find((v) => v.value === loaderVersion)?.label ||
                            loaderVersion}
                        </Text>
                      </HStack>
                    </VStack>
                  )}

                  {/* Version info summary (used also by tests) */}
                  {versionData && isVersionSupported && (
                    <Text fontSize="sm" color="textMuted" data-testid="version-info-text">
                      {modpack.versionInfo
                        .replace('{loader}', loader)
                        .replace('{version}', mcVersion)}
                    </Text>
                  )}
                </VStack>
              )}

              {/* Configurazione per modalità manuale */}
              {installMode === 'manual' && (
                <VStack gap={3} align="stretch">
                  <Box>
                    <Text fontSize="sm" color="textMuted" mb={1}>
                      {modpack.jarFileName}
                    </Text>
                    <Input
                      value={jarFileName}
                      onChange={(e) => setJarFileName(e.target.value)}
                      placeholder={modpack.jarPlaceholder}
                      data-variant="glass"
                      minH="44px"
                      fontSize={{ base: 'sm', md: 'md' }}
                    />
                  </Box>
                  <Text fontSize="sm" color="gray.500">
                    {modpack.jarHelp}
                  </Text>
                </VStack>
              )}

              {/* Pulsante di installazione */}
              <HStack wrap="wrap" gap={3}>
                <GlassButton
                  onClick={runInstall}
                  disabled={isInstallDisabled()}
                  loading={busy || versionsLoading}
                  size="md"
                  colorScheme="green"
                  minH="44px"
                >
                  {busy ? modpack.installing : versionsLoading ? common.loading : modpack.install}
                </GlassButton>
                {installMode === 'automatic' && !versionsLoading && (
                  <Text fontSize="sm" color="gray.500">
                    {modpack.installAuto
                      .replace('{loader}', loader)
                      .replace('{version}', mcVersion)}
                  </Text>
                )}
              </HStack>
            </VStack>
          </QuickActionCard>

          {/* Installation Progress */}
          <QuickActionCard
            inset
            title={`📋 ${common.status}`}
            description={modpack.progressSectionDescription ?? modpack.installPrompt}
            icon="📝"
            gradient="linear(to-r, gray.600, gray.800)"
          >
            <VStack gap={4} align="stretch">
              {/* Status indicators */}
              <HStack gap={4} wrap="wrap">
                {progress.installing && (
                  <HStack>
                    <StatusIndicator status="loading" label={modpack.installing} />
                    <Text fontSize="sm" color="blue.400">
                      ⏳ {modpack.installing}
                    </Text>
                  </HStack>
                )}
                {progress.completed && (
                  <HStack>
                    <StatusIndicator status="online" label={common.success} />
                    <Text fontSize="sm" color="green.400">
                      ✅ {common.success}
                    </Text>
                  </HStack>
                )}
                {progress.error && (
                  <HStack>
                    <StatusIndicator status="error" label={common.error} />
                    <Text fontSize="sm" color="red.400">
                      ❌ {progress.error}
                    </Text>
                  </HStack>
                )}
              </HStack>

              <Textarea
                value={progress.progress.join('\n')}
                readOnly
                rows={12}
                width="100%"
                data-variant="glass"
                fontSize={{ base: 'xs', md: 'sm' }}
                fontFamily="mono"
              />
            </VStack>
          </QuickActionCard>
        </VStack>
      </Box>
    </Box>
  )
}
