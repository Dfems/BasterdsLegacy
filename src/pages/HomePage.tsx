import { useContext, type JSX } from 'react'

import { Box, Link as ChakraLink, Grid, HStack, Text, VStack, Badge, Stack } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'

import AuthContext from '@/entities/user/AuthContext'
import LoggedInHomePage from '@/pages/LoggedInHomePage'
import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import { ModernHeader } from '@/shared/components/ModernHeader'
import { QuickActionCard } from '@/shared/components/QuickActionCard'
import { useButtonsSettings } from '@/shared/hooks/useButtonsSettings'
import useLanguage from '@/shared/hooks/useLanguage'
import { useModpackInfo } from '@/shared/hooks/useModpackInfo'
import { useServerJarStatus } from '@/shared/hooks/useServerJarStatus'

const HomePage = (): JSX.Element => {
  const { home, dashboard, common } = useLanguage()
  const { token } = useContext(AuthContext)
  const { data: buttonsSettings } = useButtonsSettings()
  const { data: modpackInfo } = useModpackInfo()
  const { data: jarStatus } = useServerJarStatus()

  type Status = {
    state: 'RUNNING' | 'STOPPED' | 'CRASHED'
    running?: boolean
  }

  const { data: status } = useQuery({
    queryKey: ['status-public'],
    queryFn: async (): Promise<Status> => {
      const r = await fetch('/api/status')
      if (!r.ok) throw new Error('status error')
      return (await r.json()) as Status
    },
    refetchInterval: 5000,
    staleTime: 2000,
  })

  // Se l'utente è loggato, mostra la versione completa
  if (token) {
    return <LoggedInHomePage />
  }

  // Stato reale JAR come fonte di verità per i guest
  const hasJar = Boolean(jarStatus?.hasJar)
  // Nome modpack: mostra solo se installato, altrimenti "Non trovato"/"Non disponibile"
  const loader = hasJar ? (modpackInfo?.loader ?? '-') : dashboard.notAvailable
  const mcVersion = hasJar ? (modpackInfo?.mcVersion ?? '-') : dashboard.notAvailable
  const loaderVersion = hasJar ? (modpackInfo?.loaderVersion ?? '-') : dashboard.notAvailable

  // Calculate stats for the modern header
  // Public overview values
  const isServerRunning = status?.state === 'RUNNING' || status?.running === true

  const toDownloadLink = (p?: string | null): string => {
    if (!p) return '#'
    if (/^https?:\/\//i.test(p)) return p
    return `/api/files/download?path=${encodeURIComponent(p)}`
  }

  // Versione per utenti non loggati (rivoluzionata)
  return (
    <Box>
      <ModernHeader title={`🎮 ${home.title}`} description={home.welcomePart} emoji="✨" />

      <Box p={{ base: 4, md: 6 }}>
        <VStack gap={6} align="stretch" maxW="900px" mx="auto">
          {/* Server Info Section */}
          <QuickActionCard
            inset
            title={`📋 ${home.loggedIn.serverOverview}`}
            description={home.loggedIn.systemInfo}
            icon="ℹ️"
            gradient="linear(to-r, blue.400, cyan.500)"
          >
            <VStack gap={4} align="stretch">
              <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
                <Box>
                  <Text fontSize="sm" color="textMuted" mb={1} textAlign="center">
                    Loader
                  </Text>
                  <Stack gap={1} align="center">
                    <Text fontSize="lg" fontWeight="bold" color="brand.primary" textAlign="center">
                      ⚙️ {loader}
                    </Text>
                    <Badge colorPalette={hasJar ? 'green' : 'orange'} variant="solid">
                      {hasJar ? home.loggedIn.modpackInstalled : home.loggedIn.modpackNotFound}
                    </Badge>
                  </Stack>
                </Box>
                <Box>
                  <Text fontSize="sm" color="textMuted" mb={1} textAlign="center">
                    Minecraft
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="brand.primary" textAlign="center">
                    🧱 {mcVersion}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="textMuted" mb={1} textAlign="center">
                    Loader Ver.
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="brand.primary" textAlign="center">
                    📋 {loaderVersion}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="textMuted" mb={1} textAlign="center">
                    {common.status}
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="brand.primary" textAlign="center">
                    {isServerRunning ? '🟢 ' + dashboard.online : '🔴 ' + dashboard.offline}
                  </Text>
                </Box>
              </Grid>
            </VStack>
          </QuickActionCard>

          {/* Downloads Section */}
          <QuickActionCard
            inset
            title={`⬇️ ${home.loggedIn.downloadSection}`}
            description={home.instructions}
            icon="📥"
            gradient="linear(to-r, green.400, teal.500)"
          >
            <VStack gap={4} align="stretch">
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
                {buttonsSettings?.config.visible && (
                  <GlassButton
                    as={ChakraLink}
                    href={toDownloadLink(buttonsSettings.config.path)}
                    download
                    size="md"
                    colorScheme="blue"
                    w="full"
                  >
                    📦 {home.configBtn}
                  </GlassButton>
                )}

                {buttonsSettings?.launcher.visible && (
                  <GlassButton
                    as={ChakraLink}
                    href={toDownloadLink(buttonsSettings.launcher.path)}
                    download={!/^https?:\/\//i.test(buttonsSettings.launcher.path ?? '')}
                    size="md"
                    colorScheme="green"
                    w="full"
                  >
                    🚀 {home.launcherBtn}
                  </GlassButton>
                )}
              </Grid>

              <GlassButton
                as={ChakraLink}
                href="https://ko-fi.com/dfems"
                target="_blank"
                rel="noopener noreferrer"
                size="md"
                colorScheme="purple"
                w="full"
              >
                {home.donateBtn}
              </GlassButton>
            </VStack>
          </QuickActionCard>

          {/* Instructions Section */}
          <QuickActionCard
            inset
            title={`📖 ${home.guide?.title ?? home.instructions}`}
            description={home.welcomePart}
            icon="🎯"
            gradient="linear(to-r, purple.400, pink.500)"
          >
            <VStack gap={3} align="stretch">
              <HStack gap={3}>
                <Text fontSize="2xl">1️⃣</Text>
                <VStack align="start" flex="1">
                  <Text fontWeight="bold" color="brand.primary">
                    {home.guide?.step1Title ?? home.configBtn}
                  </Text>
                  <Text fontSize="sm" color="textMuted">
                    {home.guide?.step1Text ?? home.instructions}
                  </Text>
                </VStack>
              </HStack>

              <HStack gap={3}>
                <Text fontSize="2xl">2️⃣</Text>
                <VStack align="start" flex="1">
                  <Text fontWeight="bold" color="brand.primary">
                    {home.guide?.step2Title ?? home.launcherBtn}
                  </Text>
                  <Text fontSize="sm" color="textMuted">
                    {home.guide?.step2Text ?? home.instructions}
                  </Text>
                </VStack>
              </HStack>

              <HStack gap={3}>
                <Text fontSize="2xl">3️⃣</Text>
                <VStack align="start" flex="1">
                  <Text fontWeight="bold" color="brand.primary">
                    {home.guide?.step3Title ?? home.title}
                  </Text>
                  <Text fontSize="sm" color="textMuted">
                    {home.guide?.step3Text ?? home.welcomePart}
                  </Text>
                </VStack>
              </HStack>

              <HStack gap={3}>
                <Text fontSize="2xl">4️⃣</Text>
                <VStack align="start" flex="1">
                  <Text fontWeight="bold" color="brand.primary">
                    {home.guide?.step4Title ?? home.title}
                  </Text>
                  <Text fontSize="sm" color="textMuted">
                    {home.guide?.step4Text ?? home.welcomePart}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </QuickActionCard>

          {/* Footer */}
          <GlassCard inset p={4} textAlign="center">
            <Text fontSize="sm" color="textMuted">
              {home.footer}
            </Text>
          </GlassCard>
        </VStack>
      </Box>
    </Box>
  )
}

export default HomePage
