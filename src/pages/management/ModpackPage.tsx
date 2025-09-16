import { useMemo, useState, type JSX } from 'react'

import { Badge, Box, Grid, HStack, Input, Text, Textarea, VStack } from '@chakra-ui/react'

import { GlassButton } from '@/shared/components/GlassButton'
import { ModernHeader } from '@/shared/components/ModernHeader'
import { QuickActionCard } from '@/shared/components/QuickActionCard'
import { SimpleSelect } from '@/shared/components/SimpleSelect'
import { StatsCard } from '@/shared/components/StatsCard'
import { StatusIndicator } from '@/shared/components/StatusIndicator'
import useLanguage from '@/shared/hooks/useLanguage'
import { useModpackInstallProgress } from '@/shared/hooks/useModpackInstallProgress'
import { useModpackVersions } from '@/shared/hooks/useModpackVersions'
import { useServerJarStatus } from '@/shared/hooks/useServerJarStatus'

type InstallMode = 'automatic' | 'manual'
type LoaderType = 'Vanilla' | 'Fabric' | 'Forge' | 'Quilt' | 'NeoForge'

export default function ModpackPage(): JSX.Element {
  const { modpack, common } = useLanguage()
  const [installMode, setInstallMode] = useState<InstallMode>('automatic')
  const [loader, setLoader] = useState<LoaderType>('Vanilla')
  const [mcVersion, setMcVersion] = useState('1.21.1')
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

  // Verifica se la versione selezionata è supportata dal loader corrente
  const isVersionSupported = useMemo(() => {
    if (!versionData) return true
    const loaderInfo = versionData.loaders[loader]
    return loaderInfo && mcVersion in loaderInfo.versions
  }, [versionData, loader, mcVersion])

  const runInstall = async () => {
    setBusy(true)
    resetProgress()

    try {
      const payload =
        installMode === 'automatic'
          ? { loader, mcVersion, mode: 'automatic' }
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

  // Calculate stats for the modern header
  const totalVersions = versionData?.minecraft.length || 0
  const supportedLoaders = versionData ? Object.keys(versionData.loaders).length : 0
  const installStatus = jarStatus?.hasJar ? 'Installato' : 'Non installato'

  return (
    <Box>
      {/* Modern Header with stunning animations and gradients */}
      <ModernHeader
        title="📦 Gestione Modpack"
        description="Sistema avanzato per installazione e configurazione modpack server"
        emoji="⚙️"
      />

      <Box p={{ base: 4, md: 6 }}>
        <VStack gap={6} align="stretch">
          {/* Stats Cards Section */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
            <StatsCard
              title="Versioni Disponibili"
              value={totalVersions}
              icon="🎮"
              badge={
                totalVersions > 0
                  ? { text: 'Disponibili', color: 'green' }
                  : { text: 'Caricamento', color: 'blue' }
              }
            />
            <StatsCard
              title="Loader Supportati"
              value={supportedLoaders}
              icon="⚙️"
              badge={{ text: 'Compatibili', color: 'blue' }}
            />
            <StatsCard
              title="Status Modpack"
              value={installStatus}
              icon="📋"
              badge={
                jarStatus?.hasJar
                  ? { text: 'Attivo', color: 'green' }
                  : { text: 'Richiesto', color: 'orange' }
              }
            />
          </Grid>

          {/* Current Modpack Status */}
          {jarStatus && (
            <QuickActionCard
              title="📦 Status Modpack Corrente"
              description="Informazioni sul modpack attualmente installato"
              icon="ℹ️"
              gradient="linear(to-r, blue.400, cyan.500)"
            >
              <VStack gap={3} align="stretch">
                <HStack gap={3} align="center" wrap="wrap">
                  <StatusIndicator
                    status={jarStatus.hasJar ? 'online' : 'offline'}
                    label={jarStatus.hasJar ? 'Installato' : 'Non installato'}
                  />
                  <Badge colorPalette={jarStatus.hasJar ? 'green' : 'orange'} variant="solid">
                    {jarStatus.hasJar ? 'Modpack Attivo' : 'Nessun Modpack'}
                  </Badge>
                </HStack>
                {jarStatus.hasJar && jarStatus.jarName && (
                  <VStack align="stretch" gap={2}>
                    <Text fontSize="sm" color="textMuted">
                      File JAR
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
              title="⚠️ Errore di Caricamento"
              description="Si è verificato un problema durante il caricamento delle versioni"
              icon="❌"
              gradient="linear(to-r, red.400, orange.500)"
            >
              <VStack gap={3}>
                <StatusIndicator status="error" label="Errore di connessione" />
                <Text color="red.200" fontSize="sm">
                  {modpack.errorVersions.replace('{error}', (versionsError as Error).message)}
                </Text>
              </VStack>
            </QuickActionCard>
          )}

          {/* Installation Mode Selection */}
          <QuickActionCard
            title="🛠️ Modalità di Installazione"
            description="Scegli il metodo di installazione più adatto alle tue esigenze"
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
                  <Text fontSize="sm" fontWeight="medium" color="textMuted">
                    Configurazione automatica
                  </Text>
                  <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
                    <Box>
                      <Text fontSize="sm" color="textMuted" mb={1}>
                        Loader
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
                        Versione Minecraft
                      </Text>
                      <SimpleSelect
                        value={mcVersion}
                        onChange={(v) => setMcVersion(v)}
                        options={mcVersionOptions}
                      />
                    </Box>
                  </Grid>

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

                  {versionData && isVersionSupported && (
                    <HStack gap={2}>
                      <StatusIndicator status="online" label="Versione supportata" />
                      <Text fontSize="sm" color="green.400">
                        {modpack.versionInfo
                          .replace('{loader}', loader)
                          .replace(
                            '{version}',
                            versionData.loaders[loader]?.versions[mcVersion] || ''
                          )}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              )}

              {/* Configurazione per modalità manuale */}
              {installMode === 'manual' && (
                <VStack gap={3} align="stretch">
                  <Text fontSize="sm" fontWeight="medium" color="textMuted">
                    Configurazione manuale
                  </Text>
                  <Box>
                    <Text fontSize="sm" color="textMuted" mb={1}>
                      Nome file JAR
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
            title="📋 Log di Installazione"
            description="Progresso e output dell'installazione in tempo reale"
            icon="📝"
            gradient="linear(to-r, gray.600, gray.800)"
          >
            <VStack gap={4} align="stretch">
              {/* Status indicators */}
              <HStack gap={4} wrap="wrap">
                {progress.installing && (
                  <HStack>
                    <StatusIndicator status="loading" label="Installazione in corso" />
                    <Text fontSize="sm" color="blue.400">
                      ⏳ Installazione in corso...
                    </Text>
                  </HStack>
                )}
                {progress.completed && (
                  <HStack>
                    <StatusIndicator status="online" label="Completata" />
                    <Text fontSize="sm" color="green.400">
                      ✅ Installazione completata!
                    </Text>
                  </HStack>
                )}
                {progress.error && (
                  <HStack>
                    <StatusIndicator status="error" label="Errore" />
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
