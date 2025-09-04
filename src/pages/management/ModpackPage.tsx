import { useMemo, useState, type JSX } from 'react'

import { Box, Heading, HStack, Input, Text, Textarea, VStack } from '@chakra-ui/react'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import { SimpleSelect } from '@/shared/components/SimpleSelect'
import useLanguage from '@/shared/hooks/useLanguage'
import { useModpackVersions } from '@/shared/hooks/useModpackVersions'

type InstallMode = 'automatic' | 'manual'
type LoaderType = 'Fabric' | 'Forge' | 'Quilt' | 'NeoForge'

export default function ModpackPage(): JSX.Element {
  const { modpack, common } = useLanguage()
  const [installMode, setInstallMode] = useState<InstallMode>('automatic')
  const [loader, setLoader] = useState<LoaderType>('Fabric')
  const [mcVersion, setMcVersion] = useState('1.21.1')
  const [jarFileName, setJarFileName] = useState('')
  const [notes, setNotes] = useState<string>('')
  const [busy, setBusy] = useState(false)

  const {
    data: versionData,
    isLoading: versionsLoading,
    error: versionsError,
  } = useModpackVersions()

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
    setNotes('')
    try {
      const payload =
        installMode === 'automatic'
          ? { loader, mcVersion, mode: 'automatic' }
          : { jarFileName, mode: 'manual' }

      const r = await fetch('/api/modpack/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await r.json()) as { ok?: boolean; notes?: string[]; error?: string }
      if (!r.ok) throw new Error(data.error || 'Install failed')
      setNotes((data.notes ?? []).join('\n'))
    } catch (e) {
      setNotes(`Errore: ${(e as Error).message}`)
    } finally {
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
          value={notes}
          readOnly
          rows={12}
          width="100%"
          data-variant="glass"
          fontSize={{ base: 'xs', md: 'sm' }} // Font size responsive per note
        />
      </GlassCard>
    </Box>
  )
}
