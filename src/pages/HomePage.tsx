import { useContext, type JSX } from 'react'

import { Box, Link as ChakraLink, Grid, HStack, Text, VStack } from '@chakra-ui/react'

import AuthContext from '@/entities/user/AuthContext'
import LoggedInHomePage from '@/pages/LoggedInHomePage'
import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import { ModernHeader } from '@/shared/components/ModernHeader'
import { QuickActionCard } from '@/shared/components/QuickActionCard'
import { StatsCard } from '@/shared/components/StatsCard'
import { StatusIndicator } from '@/shared/components/StatusIndicator'
import { useButtonsSettings } from '@/shared/hooks/useButtonsSettings'
import useLanguage from '@/shared/hooks/useLanguage'
import { useModpackInfo } from '@/shared/hooks/useModpackInfo'
import { useServerJarStatus } from '@/shared/hooks/useServerJarStatus'

const HomePage = (): JSX.Element => {
  const { home } = useLanguage()
  const { token } = useContext(AuthContext)
  const { data: buttonsSettings } = useButtonsSettings()
  const { data: modpackInfo } = useModpackInfo()
  const { data: jarStatus } = useServerJarStatus()

  // Se l'utente è loggato, mostra la versione completa
  if (token) {
    return <LoggedInHomePage />
  }

  // Determina le informazioni del modpack da mostrare
  // Priorità: informazioni reali del server > configurazioni admin > fallback
  const displayName = modpackInfo?.name ?? buttonsSettings?.modpack.name ?? "Basterd's Legacy"
  const displayVersion = modpackInfo?.version ?? buttonsSettings?.modpack.version ?? '1.0.0'
  const displayLoader = modpackInfo?.loader ?? jarStatus?.jarType ?? 'Vanilla'

  // Calculate stats for the modern header
  const serverStatus = 'Online' // Assuming online for public page
  const isModpackInstalled = jarStatus?.hasJar || false
  const availableDownloads =
    (buttonsSettings?.config.visible ? 1 : 0) + (buttonsSettings?.launcher.visible ? 1 : 0) + 1 // Ko-fi always available

  // Versione per utenti non loggati (rivoluzionata)
  return (
    <Box>
      {/* Modern Header with stunning animations and gradients */}
      <ModernHeader
        title="🎮 Basterd's Legacy"
        description="Preparatevi a un'esperienza unica e imprevedibile: un immenso multiverso con qualche mod selezionata per rendere le cose ancora più... interessanti 😉"
        emoji="✨"
      />

      <Box p={{ base: 4, md: 6 }}>
        <VStack gap={6} align="stretch" maxW="900px" mx="auto">
          {/* Stats Cards Section */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
            <StatsCard
              title="Status Server"
              value={serverStatus}
              icon="🌐"
              badge={{ text: 'Attivo', color: 'green' }}
            />
            <StatsCard
              title="Modpack"
              value={isModpackInstalled ? 'Installato' : 'Configurazione'}
              icon="📦"
              badge={
                isModpackInstalled
                  ? { text: 'Pronto', color: 'green' }
                  : { text: 'Setup', color: 'blue' }
              }
            />
            <StatsCard
              title="Download"
              value={availableDownloads}
              icon="⬇️"
              badge={{ text: 'Disponibili', color: 'purple' }}
            />
          </Grid>

          {/* Server Info Section */}
          <QuickActionCard
            title="📋 Informazioni Server"
            description="Dettagli del modpack e configurazione attuale"
            icon="ℹ️"
            gradient="linear(to-r, blue.400, cyan.500)"
          >
            <VStack gap={4} align="stretch">
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                <Box>
                  <Text fontSize="sm" color="textMuted" mb={1}>
                    Nome Modpack
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="brand.primary">
                    🎮 {displayName}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="textMuted" mb={1}>
                    Versione
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="brand.primary">
                    📋 {displayVersion}
                  </Text>
                </Box>
              </Grid>
              <HStack gap={3} align="center">
                <Text fontSize="sm" color="textMuted">
                  Loader:
                </Text>
                <StatusIndicator status="online" label={displayLoader} />
                <Text fontSize="sm" fontWeight="medium" color="brand.primary">
                  {displayLoader}
                </Text>
              </HStack>
            </VStack>
          </QuickActionCard>

          {/* Downloads Section */}
          <QuickActionCard
            title="⬇️ Download e Risorse"
            description="Scarica tutto il necessario per iniziare a giocare"
            icon="📥"
            gradient="linear(to-r, green.400, teal.500)"
          >
            <VStack gap={4} align="stretch">
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
                {/* Pulsante Config - mostra solo se visible è true */}
                {buttonsSettings?.config.visible && (
                  <GlassButton
                    as={ChakraLink}
                    href={buttonsSettings.config.path}
                    download
                    size="md"
                    minH="50px"
                    colorScheme="blue"
                    w="full"
                  >
                    📦 {home.configBtn}
                  </GlassButton>
                )}

                {/* Pulsante Launcher - mostra solo se visible è true */}
                {buttonsSettings?.launcher.visible && (
                  <GlassButton
                    as={ChakraLink}
                    href={buttonsSettings.launcher.path}
                    download
                    size="md"
                    minH="50px"
                    colorScheme="orange"
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
                minH="50px"
                colorScheme="purple"
                w="full"
              >
                {home.donateBtn}
              </GlassButton>
            </VStack>
          </QuickActionCard>

          {/* Instructions Section */}
          <QuickActionCard
            title="📖 Come Iniziare"
            description="Segui questi semplici passaggi per entrare nel server"
            icon="🎯"
            gradient="linear(to-r, purple.400, pink.500)"
          >
            <VStack gap={3} align="stretch">
              <HStack gap={3}>
                <Text fontSize="2xl">1️⃣</Text>
                <VStack align="start" flex="1">
                  <Text fontWeight="bold" color="brand.primary">
                    Scarica le mod necessarie
                  </Text>
                  <Text fontSize="sm" color="textMuted">
                    Utilizza il pulsante "Mods to install" per scaricare il pacchetto
                  </Text>
                </VStack>
              </HStack>

              <HStack gap={3}>
                <Text fontSize="2xl">2️⃣</Text>
                <VStack align="start" flex="1">
                  <Text fontWeight="bold" color="brand.primary">
                    Configura il launcher
                  </Text>
                  <Text fontSize="sm" color="textMuted">
                    Scarica e configura CurseForge o il tuo launcher preferito
                  </Text>
                </VStack>
              </HStack>

              <HStack gap={3}>
                <Text fontSize="2xl">3️⃣</Text>
                <VStack align="start" flex="1">
                  <Text fontWeight="bold" color="brand.primary">
                    Collegati al server
                  </Text>
                  <Text fontSize="sm" color="textMuted">
                    Entra nel gioco e divertiti con la nostra community!
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
