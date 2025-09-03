import { useState, useMemo, type JSX } from 'react'

import { Box, Heading, HStack, Input, Text, Textarea, VStack } from '@chakra-ui/react'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import { SimpleSelect } from '@/shared/components/SimpleSelect'
import { useModpackVersions } from '@/shared/hooks/useModpackVersions'

type InstallMode = 'automatic' | 'manual'
type LoaderType = 'Fabric' | 'Forge' | 'Quilt' | 'NeoForge'

export default function ModpackPage(): JSX.Element {
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
    <Box p={6}>
      <Heading mb={4}>Modpack</Heading>

      {versionsError && (
        <GlassCard mb={4} bg="red.900" borderColor="red.600">
          <Text color="red.200">
            Errore nel caricamento delle versioni: {(versionsError as Error).message}
          </Text>
        </GlassCard>
      )}

      <GlassCard mb={4}>
        <VStack gap={4} align="stretch">
          {/* Modalità di installazione */}
          <HStack gap={3} wrap="wrap">
            <Text minWidth="fit-content">Modalità:</Text>
            <SimpleSelect
              value={installMode}
              onChange={(v) => setInstallMode(v as InstallMode)}
              options={[
                { value: 'automatic', label: 'Automatica' },
                { value: 'manual', label: 'Manuale (JAR personalizzato)' },
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
                <Text fontSize="sm" color="orange.400">
                  ⚠️ Versione {mcVersion} non supportata da {loader}
                </Text>
              )}

              {versionData && isVersionSupported && (
                <Text fontSize="sm" color="gray.400">
                  Versione {loader}: {versionData.loaders[loader]?.versions[mcVersion]}
                </Text>
              )}
            </VStack>
          )}

          {/* Configurazione per modalità manuale */}
          {installMode === 'manual' && (
            <HStack gap={3} wrap="wrap">
              <Input
                value={jarFileName}
                onChange={(e) => setJarFileName(e.target.value)}
                placeholder="Nome del file JAR (es. forge-installer.jar)"
                flex="1"
              />
              <Text fontSize="sm" color="gray.500">
                Il JAR deve essere già presente nella directory del server
              </Text>
            </HStack>
          )}

          {/* Pulsante di installazione */}
          <HStack>
            <GlassButton onClick={runInstall} disabled={isInstallDisabled()}>
              {busy ? 'Installazione…' : versionsLoading ? 'Caricamento...' : 'Installa'}
            </GlassButton>
            {installMode === 'automatic' && !versionsLoading && (
              <Text fontSize="sm" color="gray.500">
                Scaricherà automaticamente l'installer per {loader} {mcVersion}
              </Text>
            )}
          </HStack>
        </VStack>
      </GlassCard>

      <GlassCard inset>
        <Text mb={2}>Note</Text>
        <Textarea value={notes} readOnly rows={12} width="100%" />
      </GlassCard>
    </Box>
  )
}
