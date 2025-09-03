import type { JSX } from 'react'

import { Box, Link as ChakraLink, Heading, Stack, Text } from '@chakra-ui/react'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import useLanguage from '@/shared/hooks/useLanguage'

const HomePage = (): JSX.Element => {
  const { t } = useLanguage()

  return (
    <Box p={6}>
      <GlassCard maxW="720px" mx="auto" textAlign="center" p={6}>
        <Heading mb={3}>{t.title}</Heading>
        <Text mb={4}>{t.welcomePart}</Text>
        <Stack gap={3} align="center">
          <GlassButton as={ChakraLink} href="dfemscraft-config.zip" download>
            {t.configBtn}
          </GlassButton>
          <GlassButton as={ChakraLink} href="dfemscraft-launcher.jar" download>
            {t.launcherBtn}
          </GlassButton>
          <GlassButton
            as={ChakraLink}
            href="https://example.com/donate"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.donateBtn}
          </GlassButton>
        </Stack>
        <Text mt={6} fontSize="sm" color="textMuted">
          {t.footer}
        </Text>
      </GlassCard>
    </Box>
  )
}

export default HomePage
