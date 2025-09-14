import { type JSX } from 'react'

import {
  Badge,
  Box,
  Link as ChakraLink,
  Grid,
  HStack,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import { useButtonsSettings } from '@/shared/hooks/useButtonsSettings'
import useLanguage from '@/shared/hooks/useLanguage'
import { useModpackInfo } from '@/shared/hooks/useModpackInfo'
import { useServerJarStatus } from '@/shared/hooks/useServerJarStatus'

type Status = {
  state: 'RUNNING' | 'STOPPED' | 'CRASHED'
  pid: number | null
  uptimeMs: number
  cpu: number
  memMB: number
  running?: boolean
}

const fmtUptime = (ms: number): string => {
  const sec = Math.floor(ms / 1000)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h}h ${m}m ${s}s`
}

const LoggedInHomePage = (): JSX.Element => {
  const { home, common } = useLanguage()
  const { data: jarStatus } = useServerJarStatus()
  const { data: buttonsSettings } = useButtonsSettings()
  const { data: modpackInfo } = useModpackInfo()

  const { data: status, error } = useQuery({
    queryKey: ['status'],
    queryFn: async (): Promise<Status> => {
      const r = await fetch('/api/status')
      if (!r.ok) throw new Error('status error')
      return (await r.json()) as Status
    },
    refetchInterval: 5000,
    staleTime: 2000,
  })

  const isServerRunning = status?.state === 'RUNNING' || status?.running === true

  // Determina le informazioni del modpack da mostrare
  // Priorità: informazioni reali del server > configurazioni admin > fallback
  const displayName = modpackInfo?.name ?? buttonsSettings?.modpack.name ?? "Basterd's Legacy"
  const displayVersion = modpackInfo?.loader
    ? `${modpackInfo.loader} ${modpackInfo.version}`
    : (buttonsSettings?.modpack.version ?? '1.0.0')

  return (
    <Box p={{ base: 4, md: 6 }}>
      <GlassCard inset maxW="1200px" mx="auto" p={{ base: 4, md: 6 }}>
        {/* Header di benvenuto */}
        <Box textAlign="center" mb={6}>
          <Heading mb={3} fontSize={{ base: 'xl', md: '2xl' }}>
            {home.loggedIn?.welcomeBack ?? 'Bentornato, amministratore!'}
          </Heading>
          <Text fontSize={{ base: 'sm', md: 'md' }} color="textMuted">
            {home.welcomePart}
          </Text>
        </Box>

        {/* Grid principale */}
        <Grid
          templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }}
          gap={{ base: 4, md: 6 }}
          mb={6}
        >
          {/* Panoramica Server */}
          <GlassCard inset p={{ base: 4, md: 5 }}>
            <Heading size={{ base: 'sm', md: 'md' }} mb={4}>
              🖥️ {home.loggedIn?.serverOverview ?? 'Panoramica Server'}
            </Heading>

            {/* Stato Server */}
            <HStack mb={3} justify="space-between" wrap="wrap">
              <Text fontSize={{ base: 'sm', md: 'md' }}>{common.status}:</Text>
              <Badge
                colorPalette={isServerRunning ? 'green' : 'red'}
                variant="solid"
                fontSize={{ base: 'xs', md: 'sm' }}
              >
                {isServerRunning
                  ? (home.loggedIn?.serverRunning ?? 'Attivo')
                  : (home.loggedIn?.serverStopped ?? 'Spento')}
              </Badge>
            </HStack>

            {/* Stato Modpack */}
            {jarStatus && (
              <HStack mb={3} justify="space-between" wrap="wrap">
                <Text fontSize={{ base: 'sm', md: 'md' }}>{common.modpack}:</Text>
                <HStack gap={2}>
                  <Badge
                    colorPalette={jarStatus.hasJar ? 'green' : 'orange'}
                    variant="solid"
                    fontSize={{ base: 'xs', md: 'sm' }}
                  >
                    {jarStatus.hasJar ? 'Installato' : 'Non trovato'}
                  </Badge>
                  {jarStatus.hasJar && jarStatus.jarType && (
                    <Badge
                      colorPalette="blue"
                      variant="outline"
                      fontSize={{ base: 'xs', md: 'sm' }}
                    >
                      {jarStatus.jarType.toUpperCase()}
                    </Badge>
                  )}
                </HStack>
              </HStack>
            )}

            {/* Informazioni modpack corrente */}
            {(modpackInfo || buttonsSettings) && (
              <>
                <HStack mb={2} justify="space-between">
                  <Text fontSize={{ base: 'sm', md: 'md' }}>Modpack:</Text>
                  <Text fontSize={{ base: 'sm', md: 'md' }}>{displayName}</Text>
                </HStack>
                <HStack mb={3} justify="space-between">
                  <Text fontSize={{ base: 'sm', md: 'md' }}>Versione:</Text>
                  <Text fontSize={{ base: 'sm', md: 'md' }}>{displayVersion}</Text>
                </HStack>
                {modpackInfo?.loader && (
                  <HStack mb={3} justify="space-between">
                    <Text fontSize={{ base: 'sm', md: 'md' }}>Loader:</Text>
                    <Badge
                      colorPalette="blue"
                      variant="outline"
                      fontSize={{ base: 'xs', md: 'sm' }}
                    >
                      {modpackInfo.loader.toUpperCase()}
                    </Badge>
                  </HStack>
                )}
              </>
            )}

            {/* Informazioni sistema se disponibili */}
            {status && isServerRunning && (
              <>
                <HStack mb={2} justify="space-between">
                  <Text fontSize={{ base: 'sm', md: 'md' }}>{home.loggedIn?.cpu ?? 'CPU'}:</Text>
                  <Text fontSize={{ base: 'sm', md: 'md' }}>{status.cpu.toFixed(1)}%</Text>
                </HStack>
                <HStack mb={2} justify="space-between">
                  <Text fontSize={{ base: 'sm', md: 'md' }}>
                    {home.loggedIn?.memory ?? 'Memoria'}:
                  </Text>
                  <Text fontSize={{ base: 'sm', md: 'md' }}>{status.memMB} MB</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize={{ base: 'sm', md: 'md' }}>
                    {home.loggedIn?.uptime ?? 'Uptime'}:
                  </Text>
                  <Text fontSize={{ base: 'sm', md: 'md' }}>{fmtUptime(status.uptimeMs)}</Text>
                </HStack>
              </>
            )}

            {error && (
              <Text color="accent.danger" fontSize={{ base: 'xs', md: 'sm' }} mt={2}>
                {common.error}: {(error as Error).message}
              </Text>
            )}
          </GlassCard>

          {/* Azioni Rapide */}
          <GlassCard inset p={{ base: 4, md: 5 }}>
            <Heading size={{ base: 'sm', md: 'md' }} mb={4}>
              ⚡ {home.loggedIn?.quickActions ?? 'Azioni Rapide'}
            </Heading>

            <Stack gap={3}>
              <GlassButton
                as={ChakraLink}
                href="/app/dashboard"
                size={{ base: 'sm', md: 'md' }}
                w="100%"
                textAlign="left"
                justifyContent="flex-start"
              >
                {home.loggedIn?.goToDashboard ?? '📊 Vai al Dashboard'}
              </GlassButton>

              <GlassButton
                as={ChakraLink}
                href="/app/console"
                size={{ base: 'sm', md: 'md' }}
                w="100%"
                textAlign="left"
                justifyContent="flex-start"
              >
                {home.loggedIn?.goToConsole ?? '💻 Apri Console'}
              </GlassButton>

              <GlassButton
                as={ChakraLink}
                href="/app/files"
                size={{ base: 'sm', md: 'md' }}
                w="100%"
                textAlign="left"
                justifyContent="flex-start"
              >
                {home.loggedIn?.goToFiles ?? '📁 Gestisci File'}
              </GlassButton>
            </Stack>
          </GlassCard>
        </Grid>

        {/* Sezione Download & Supporto */}
        <GlassCard inset p={{ base: 4, md: 5 }}>
          <Heading size={{ base: 'sm', md: 'md' }} mb={4} textAlign="center">
            📦 {home.loggedIn?.downloadSection ?? 'Download & Supporto'}
          </Heading>

          <Stack direction={{ base: 'column', sm: 'row' }} gap={3} align="center" justify="center">
            {/* Pulsante Config - mostra solo se visible è true */}
            {buttonsSettings?.config.visible && (
              <GlassButton
                as={ChakraLink}
                href={buttonsSettings.config.path}
                download
                size={{ base: 'sm', md: 'md' }}
                minH="44px"
              >
                {home.configBtn}
              </GlassButton>
            )}

            {/* Pulsante Launcher - mostra solo se visible è true */}
            {buttonsSettings?.launcher.visible && (
              <GlassButton
                as={ChakraLink}
                href={buttonsSettings.launcher.path}
                download
                size={{ base: 'sm', md: 'md' }}
                minH="44px"
              >
                {home.launcherBtn}
              </GlassButton>
            )}

            <GlassButton
              as={ChakraLink}
              href="https://ko-fi.com/dfems"
              target="_blank"
              rel="noopener noreferrer"
              size={{ base: 'sm', md: 'md' }}
              minH="44px"
              colorPalette="purple"
            >
              {home.donateBtn}
            </GlassButton>
          </Stack>
        </GlassCard>

        <Text mt={6} fontSize={{ base: 'xs', md: 'sm' }} color="textMuted" textAlign="center">
          {home.footer}
        </Text>
      </GlassCard>
    </Box>
  )
}

export default LoggedInHomePage
