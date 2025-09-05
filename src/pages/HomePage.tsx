import { useCallback, useContext, useEffect, useState, type JSX } from 'react'

import { Badge, Box, HStack, Link as ChakraLink, Heading, Stack, Text } from '@chakra-ui/react'

import AuthContext from '@/entities/user/AuthContext'
import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import useLanguage from '@/shared/hooks/useLanguage'
import { useServerJarStatus } from '@/shared/hooks/useServerJarStatus'

const HomePage = (): JSX.Element => {
  const { t } = useLanguage()
  const { token } = useContext(AuthContext)
  const { data: jarStatus } = useServerJarStatus()
  const [serverRunning, setServerRunning] = useState(false)
  const [busy, setBusy] = useState(false)

  // Fetch server status
  const fetchStatus = useCallback(async () => {
    try {
      const resp = await fetch('/api/status')
      const data = (await resp.json()) as { running?: boolean }
      setServerRunning(Boolean(data.running))
    } catch {
      setServerRunning(false)
    }
  }, [])

  // Power control function
  const power = useCallback(
    async (action: 'start' | 'stop' | 'restart') => {
      setBusy(true)
      try {
        // Controllo: non permettere start se non c'è JAR
        if (action === 'start' && (!jarStatus?.canStart || !jarStatus?.hasJar)) {
          alert('Nessun JAR del server trovato. Installa un modpack prima di avviare.')
          return
        }

        await fetch('/api/power', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        await fetchStatus()
      } catch (e) {
        alert(`Errore: ${(e as Error).message}`)
      } finally {
        setBusy(false)
      }
    },
    [fetchStatus, jarStatus?.canStart, jarStatus?.hasJar]
  )

  // Fetch status on mount
  useEffect(() => {
    if (token) {
      fetchStatus()
    }
  }, [token, fetchStatus])

  return (
    <Box p={{ base: 4, md: 6 }}>
      {' '}
      {/* Padding responsive */}
      <GlassCard maxW="720px" mx="auto" textAlign="center" p={{ base: 4, md: 6 }}>
        {' '}
        {/* Padding responsive */}
        <Heading mb={3} fontSize={{ base: 'lg', md: 'xl' }}>
          {t.title}
        </Heading>{' '}
        {/* Font size responsive */}
        <Text mb={4} fontSize={{ base: 'sm', md: 'md' }}>
          {t.welcomePart}
        </Text>{' '}
        {/* Font size responsive */}
        {/* Server Status and Controls - Solo se autenticato */}
        {token && (
          <GlassCard mb={4} p={{ base: 3, md: 4 }}>
            <Heading size={{ base: 'sm', md: 'md' }} mb={3}>
              🖥️ Controlli Server
            </Heading>

            {/* Stato Server */}
            <HStack mb={3} gap={3} align="center" wrap="wrap" justify="center">
              <Text fontSize={{ base: 'sm', md: 'md' }}>Stato Server:</Text>
              <Badge colorPalette={serverRunning ? 'green' : 'red'} variant="solid">
                {serverRunning ? 'In Esecuzione' : 'Spento'}
              </Badge>
            </HStack>

            {/* Stato Modpack */}
            {jarStatus && (
              <HStack mb={3} gap={3} align="center" wrap="wrap" justify="center">
                <Text fontSize={{ base: 'sm', md: 'md' }}>Modpack:</Text>
                <Badge colorPalette={jarStatus.hasJar ? 'green' : 'orange'} variant="solid">
                  {jarStatus.hasJar ? 'Installato' : 'Non trovato'}
                </Badge>
                {jarStatus.hasJar && jarStatus.jarType && (
                  <Badge colorPalette="blue" variant="outline">
                    {jarStatus.jarType.toUpperCase()}
                  </Badge>
                )}
              </HStack>
            )}

            {/* Controlli Server */}
            <HStack gap={2} wrap="wrap" justify="center">
              <GlassButton
                size={{ base: 'sm', md: 'md' }}
                onClick={() => void power(serverRunning ? 'stop' : 'start')}
                disabled={busy || (!serverRunning && !jarStatus?.canStart)}
                minH="44px"
                colorPalette={serverRunning ? 'red' : 'green'}
              >
                {serverRunning ? '🛑 Stop' : '▶️ Start'}
              </GlassButton>
              {serverRunning && (
                <GlassButton
                  size={{ base: 'sm', md: 'md' }}
                  onClick={() => void power('restart')}
                  disabled={busy}
                  minH="44px"
                  colorPalette="orange"
                >
                  🔄 Restart
                </GlassButton>
              )}
            </HStack>

            {!jarStatus?.hasJar && (
              <Text fontSize={{ base: 'xs', md: 'sm' }} color="orange.300" mt={2}>
                💡 Vai alla pagina Modpack per installare un server
              </Text>
            )}
          </GlassCard>
        )}
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
        <Text mt={6} fontSize={{ base: 'xs', md: 'sm' }} color="textMuted">
          {' '}
          {/* Font size responsive */}
          {t.footer}
        </Text>
      </GlassCard>
    </Box>
  )
}

export default HomePage
