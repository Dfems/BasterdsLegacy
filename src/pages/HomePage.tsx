import type { JSX } from 'react'

import { Box, Link as ChakraLink, Heading, Stack, Text } from '@chakra-ui/react'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import useLanguage from '@/shared/hooks/useLanguage'

const HomePage = (): JSX.Element => {
  const { t } = useLanguage()

  return (
    <Box p={{ base: 4, md: 6 }}> {/* Padding responsive */}
      <GlassCard maxW="720px" mx="auto" textAlign="center" p={{ base: 4, md: 6 }}> {/* Padding responsive */}
        <Heading mb={3} fontSize={{ base: 'lg', md: 'xl' }}>{t.title}</Heading> {/* Font size responsive */}
        <Text mb={4} fontSize={{ base: 'sm', md: 'md' }}>{t.welcomePart}</Text> {/* Font size responsive */}
        <Stack gap={3} align="center">
          <GlassButton 
            as={ChakraLink} 
            href="dfemscraft-config.zip" 
            download
            size={{ base: 'sm', md: 'md' }}
            minH="44px" // Touch target minimo per mobile
          >
            {t.configBtn}
          </GlassButton>
          <GlassButton 
            as={ChakraLink} 
            href="dfemscraft-launcher.jar" 
            download
            size={{ base: 'sm', md: 'md' }}
            minH="44px" // Touch target minimo per mobile
          >
            {t.launcherBtn}
          </GlassButton>
          <GlassButton
            as={ChakraLink}
            href="https://example.com/donate"
            target="_blank"
            rel="noopener noreferrer"
            size={{ base: 'sm', md: 'md' }}
            minH="44px" // Touch target minimo per mobile
          >
            {t.donateBtn}
          </GlassButton>
        </Stack>
        <Text mt={6} fontSize={{ base: 'xs', md: 'sm' }} color="textMuted"> {/* Font size responsive */}
          {t.footer}
        </Text>
      </GlassCard>
    </Box>
  )
}

export default HomePage
