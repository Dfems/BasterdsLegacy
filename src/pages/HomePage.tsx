import { useContext, type JSX } from 'react'

import { Box, Link as ChakraLink, Heading, Stack, Text } from '@chakra-ui/react'

import AuthContext from '@/entities/user/AuthContext'
import LoggedInHomePage from '@/pages/LoggedInHomePage'
import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import { useButtonsSettings } from '@/shared/hooks/useButtonsSettings'
import useLanguage from '@/shared/hooks/useLanguage'

const HomePage = (): JSX.Element => {
  const { home } = useLanguage()
  const { token } = useContext(AuthContext)
  const { data: buttonsSettings } = useButtonsSettings()

  // Se l'utente è loggato, mostra la versione completa
  if (token) {
    return <LoggedInHomePage />
  }

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
        {buttonsSettings && (
          <Box mb={4} p={2} borderRadius="md" bg="whiteAlpha.100">
            <Text fontSize={{ base: 'xs', md: 'sm' }} color="textMuted">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(home.loggedIn as any)?.currentModpack
                ? /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                  (home.loggedIn as any).currentModpack.replace(
                    '{name}',
                    buttonsSettings.modpack.name
                  )
                : `Modpack corrente: ${buttonsSettings.modpack.name}`}
            </Text>
            <Text fontSize={{ base: 'xs', md: 'sm' }} color="textMuted">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(home.loggedIn as any)?.currentVersion
                ? /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                  (home.loggedIn as any).currentVersion.replace(
                    '{version}',
                    buttonsSettings.modpack.version
                  )
                : `Versione: ${buttonsSettings.modpack.version}`}
            </Text>
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
