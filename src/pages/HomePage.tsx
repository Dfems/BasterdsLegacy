import { useContext, type JSX } from 'react'

import { Box, Link as ChakraLink, Heading, Stack, Text } from '@chakra-ui/react'

import AuthContext from '@/entities/user/AuthContext'
import LoggedInHomePage from '@/pages/LoggedInHomePage'
import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
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
  const displayVersion = modpackInfo?.loader
    ? `${modpackInfo.loader} ${modpackInfo.version}`
    : (buttonsSettings?.modpack.version ?? '1.0.0')

  // Versione per utenti non loggati (rimane invariata come richiesto)
  return (
    <Box p={{ base: 4, md: 6 }}>
      <GlassCard maxW="720px" mx="auto" textAlign="center" p={{ base: 4, md: 6 }}>
        <Heading mb={3} fontSize={{ base: 'lg', md: 'xl' }}>
          {home.title}
        </Heading>
        <Text mb={4} fontSize={{ base: 'sm', md: 'md' }}>
          {home.welcomePart}
        </Text>

        {/* Mostra modpack e versione corrente se disponibili */}
        {(modpackInfo || buttonsSettings) && (
          <Box mb={4} p={2} borderRadius="md" bg="whiteAlpha.100">
            <Text fontSize={{ base: 'xs', md: 'sm' }} color="textMuted">
              Modpack corrente: {displayName}
            </Text>
            <Text fontSize={{ base: 'xs', md: 'sm' }} color="textMuted">
              Versione: {displayVersion}
            </Text>
            {jarStatus?.jarType && (
              <Text fontSize={{ base: 'xs', md: 'sm' }} color="textMuted" fontWeight="medium">
                Loader: {jarStatus.jarType.toUpperCase()}
              </Text>
            )}
          </Box>
        )}

        <Stack gap={3} align="center">
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

        <Text mt={6} fontSize={{ base: 'xs', md: 'sm' }} color="textMuted">
          {home.footer}
        </Text>
      </GlassCard>
    </Box>
  )
}

export default HomePage
