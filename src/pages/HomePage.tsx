import { useContext, type JSX } from 'react'

import { Box, Link as ChakraLink, Heading, Stack, Text } from '@chakra-ui/react'

import AuthContext from '@/entities/user/AuthContext'
import LoggedInHomePage from '@/pages/LoggedInHomePage'
import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import useLanguage from '@/shared/hooks/useLanguage'

const HomePage = (): JSX.Element => {
  const { t } = useLanguage()
  const { token } = useContext(AuthContext)

  // Se l'utente è loggato, mostra la versione completa
  if (token) {
    return <LoggedInHomePage />
  }

  // Versione per utenti non loggati (rimane invariata come richiesto)
  return (
    <Box p={{ base: 4, md: 6 }}>
      <GlassCard maxW="720px" mx="auto" textAlign="center" p={{ base: 4, md: 6 }}>
        <Heading mb={3} fontSize={{ base: 'lg', md: 'xl' }}>
          {t.title}
        </Heading>
        <Text mb={4} fontSize={{ base: 'sm', md: 'md' }}>
          {t.welcomePart}
        </Text>
        
        <Stack gap={3} align="center">
          <GlassButton
            as={ChakraLink}
            href="dfemscraft-config.zip"
            download
            size={{ base: 'sm', md: 'md' }}
            minH="44px"
          >
            {t.configBtn}
          </GlassButton>
          <GlassButton
            as={ChakraLink}
            href="dfemscraft-launcher.jar"
            download
            size={{ base: 'sm', md: 'md' }}
            minH="44px"
          >
            {t.launcherBtn}
          </GlassButton>
          <GlassButton
            as={ChakraLink}
            href="https://ko-fi.com/dfems"
            target="_blank"
            rel="noopener noreferrer"
            size={{ base: 'sm', md: 'md' }}
            minH="44px"
            colorPalette="purple"
          >
            {t.donateBtn}
          </GlassButton>
        </Stack>
        
        <Text mt={6} fontSize={{ base: 'xs', md: 'sm' }} color="textMuted">
          {t.footer}
        </Text>
      </GlassCard>
    </Box>
  )
}

export default HomePage
