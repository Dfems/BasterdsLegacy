import { useMemo, useState, type JSX } from 'react'

import { Badge, Box, Heading, HStack, Input, Text, Textarea, VStack } from '@chakra-ui/react'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import { SimpleSelect } from '@/shared/components/SimpleSelect'
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

  return (
    <Box p={{ base: 4, md: 6 }}>
      {' '}
      {/* Padding responsive */}
      <Heading mb={4} fontSize={{ base: 'md', md: 'lg' }}>
        {modpack.title}
      </Heading>{' '}
      {/* Font size responsive */}
      {/* Stato Modpack Esistente */}
      {jarStatus && (
        <GlassCard mb={4} p={{ base: 3, md: 4 }}>
          <HStack gap={3} align="center" wrap="wrap">
            <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold">
              Stato Attuale:
            </Text>
            <Badge colorPalette={jarStatus.hasJar ? 'green' : 'orange'} variant="solid">
              {jarStatus.hasJar ? 'Modpack Installato' : 'Nessun Modpack'}
            </Badge>
            {jarStatus.hasJar && jarStatus.jarName && (
              <>
                <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.400">
                  {jarStatus.jarName}
                </Text>
                {jarStatus.jarType && (
                  <Badge colorPalette="blue" variant="outline">
                    {jarStatus.jarType.toUpperCase()}
                  </Badge>
                )}
              </>
            )}
          </HStack>
        </GlassCard>
      )}
      {versionsError && (
        <GlassCard mb={4} bg="red.900" borderColor="red.600" p={{ base: 3, md: 4 }}>
          {' '}
          {/* Padding responsive */}
          <Text color="red.200" fontSize={{ base: 'sm', md: 'md' }}>
            {' '}
            {/* Font size responsive */}
            {modpack.errorVersions.replace('{error}', (versionsError as Error).message)}
          </Text>
        </GlassCard>
      )}
      <GlassCard mb={4} p={{ base: 3, md: 4 }}>
        {' '}
        {/* Padding responsive */}
        <VStack gap={4} align="stretch">
          {/* Modalità di installazione */}
          <HStack gap={3} wrap="wrap">
            <Text minWidth="fit-content" fontSize={{ base: 'sm', md: 'md' }}>
              {' '}
              {/* Font size responsive */}
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
              <HStack gap={3} wrap="wrap">
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
                <SimpleSelect
                  value={mcVersion}
                  onChange={(v) => setMcVersion(v)}
                  options={mcVersionOptions}
                />
              </HStack>

              {!isVersionSupported && (
                <Text fontSize={{ base: 'sm', md: 'md' }} color="orange.400">
                  {' '}
                  {/* Font size responsive */}
                  {modpack.versionUnsupported
                    .replace('{version}', mcVersion)
                    .replace('{loader}', loader)}
                </Text>
              )}

              {versionData && isVersionSupported && (
                <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.400">
                  {modpack.versionInfo
                    .replace('{loader}', loader)
                    .replace('{version}', versionData.loaders[loader]?.versions[mcVersion] || '')}
                </Text>
              )}
            </VStack>
          )}

          {/* Configurazione per modalità manuale */}
          {installMode === 'manual' && (
            <VStack gap={3} align="stretch">
              <Input
                value={jarFileName}
                onChange={(e) => setJarFileName(e.target.value)}
                placeholder={modpack.jarPlaceholder}
                data-variant="glass"
                minH="44px" // Touch target
                fontSize={{ base: 'sm', md: 'md' }} // Font size responsive
              />
              <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.500">
                {modpack.jarHelp}
              </Text>
            </VStack>
          )}

          {/* Pulsante di installazione */}
          <HStack wrap="wrap">
            <GlassButton
              onClick={runInstall}
              disabled={isInstallDisabled()}
              size={{ base: 'sm', md: 'md' }} // Size responsive
              minH="44px" // Touch target
            >
              {busy ? modpack.installing : versionsLoading ? common.loading : modpack.install}
            </GlassButton>
            {installMode === 'automatic' && !versionsLoading && (
              <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.500">
                {modpack.installAuto.replace('{loader}', loader).replace('{version}', mcVersion)}
              </Text>
            )}
          </HStack>
        </VStack>
      </GlassCard>
      <GlassCard inset p={{ base: 3, md: 4 }}>
        {' '}
        {/* Padding responsive */}
        <Text mb={2} fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold">
          {' '}
          {/* Font size responsive */}
          {modpack.notes}
        </Text>
        <Textarea
          value={progress.progress.join('\n')}
          readOnly
          rows={12}
          width="100%"
          data-variant="glass"
          fontSize={{ base: 'xs', md: 'sm' }} // Font size responsive per note
        />
        {progress.installing && (
          <Text mt={2} fontSize={{ base: 'xs', md: 'sm' }} color="blue.400">
            ⏳ Installazione in corso...
          </Text>
        )}
        {progress.completed && (
          <Text mt={2} fontSize={{ base: 'xs', md: 'sm' }} color="green.400">
            ✅ Installazione completata!
          </Text>
        )}
        {progress.error && (
          <Text mt={2} fontSize={{ base: 'xs', md: 'sm' }} color="red.400">
            ❌ {progress.error}
          </Text>
        )}
      </GlassCard>
    </Box>
  )
}
