import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type JSX,
} from 'react'

import { Badge, Box, HStack, Input, Stack, Text, Textarea } from '@chakra-ui/react'

import AuthContext from '@/entities/user/AuthContext'
import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import { ModernHeader } from '@/shared/components/ModernHeader'
import { QuickActionCard } from '@/shared/components/QuickActionCard'
import { StatusIndicator } from '@/shared/components/StatusIndicator'
import { useConsoleContext } from '@/shared/contexts/useConsoleContext'
import useLanguage from '@/shared/hooks/useLanguage'
import { useServerJarStatus } from '@/shared/hooks/useServerJarStatus'

type WsMsg = { type?: string; data?: unknown }

export default function ConsolePage(): JSX.Element {
  const { server } = useLanguage()
  const { token } = useContext(AuthContext)
  const { data: jarStatus, isLoading: jarLoading } = useServerJarStatus()
  const { output, setOutput, clearOutput } = useConsoleContext()

  const [command, setCommand] = useState('')
  const [busy, setBusy] = useState(false)
  const [serverRunning, setServerRunning] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const outputRef = useRef<HTMLTextAreaElement>(null)

  // auto scroll
  useEffect(() => {
    const el = outputRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [output])

  const fetchStatus = useCallback(async () => {
    try {
      const resp = await fetch('/api/status')
      const data = (await resp.json()) as { running?: boolean }
      setServerRunning(Boolean(data.running))
    } catch {
      setServerRunning(false)
    }
  }, [])

  // connect WS when token and running
  useEffect(() => {
    if (!token) return
    const connect = () => {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws'
      const ws = new WebSocket(
        `${proto}://${location.host}/ws/console?token=${encodeURIComponent(token)}`
      )
      wsRef.current = ws
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as WsMsg
          if (msg.type === 'log' && typeof msg.data === 'string') {
            setOutput((o: string) => o + msg.data + '\n')
          } else if (msg.type === 'status' && msg.data && typeof msg.data === 'object') {
            const running = (msg.data as { running?: boolean }).running
            if (typeof running === 'boolean') setServerRunning(running)
          }
        } catch {
          // ignore
        }
      }
      ws.onclose = () => {
        wsRef.current = null
      }
    }
    fetchStatus().then(connect).catch(connect)
    return () => {
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [token, fetchStatus, setOutput])

  const sendCmd = useCallback(
    (cmd: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
      const payload = JSON.stringify({ type: 'cmd', data: cmd })
      wsRef.current.send(payload)
      setOutput((o: string) => o + `> ${cmd}\n`)
    },
    [setOutput]
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!serverRunning) return
    const trimmed = command.trim()
    if (trimmed) sendCmd(trimmed)
    setCommand('')
  }

  const power = useCallback(
    async (action: 'start' | 'stop' | 'restart') => {
      setBusy(true)
      try {
        // Controllo aggiuntivo: non permettere start se non c'è JAR
        if (action === 'start' && (!jarStatus?.canStart || !jarStatus?.hasJar)) {
          setOutput(
            (o: string) =>
              o + 'Errore: Nessun JAR del server trovato. Installa un modpack prima di avviare.\n'
          )
          return
        }

        await fetch('/api/power', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        if (action === 'start') setOutput((o: string) => o + server.startingMessage + '\n')
        if (action === 'stop') setOutput((o: string) => o + server.stoppingMessage + '\n')
        if (action === 'restart') setOutput((o: string) => o + server.restartingMessage + '\n')
        await fetchStatus()
      } catch (e) {
        setOutput(
          (o: string) => o + server.powerError.replace('{error}', (e as Error).message) + '\n'
        )
      } finally {
        setBusy(false)
      }
    },
    [
      fetchStatus,
      server.startingMessage,
      server.stoppingMessage,
      server.restartingMessage,
      server.powerError,
      jarStatus?.canStart,
      jarStatus?.hasJar,
      setOutput,
    ]
  )

  const clearConsoleOutput = () => clearOutput()

  return (
    <Box p={{ base: 4, md: 6, lg: 8 }} maxW="7xl" mx="auto">
      {/* Modern Header */}
      <ModernHeader
        title="Console Server"
        description="Controlla il server in tempo reale con comandi avanzati e monitoraggio live"
        emoji="💻"
        gradient="linear(135deg, green.500/15, emerald.500/15, teal.500/10)"
      />

      {/* Server Status */}
      <Box mb={6}>
        <StatusIndicator
          status={serverRunning ? 'online' : 'offline'}
          label="Stato Server"
          details={serverRunning ? 'Server attivo e operativo' : 'Server spento'}
          size="md"
        />
      </Box>

      {/* Modpack Status */}
      {!jarLoading && jarStatus && (
        <GlassCard p={4} mb={6}>
          <HStack gap={3} align="center" wrap="wrap">
            <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold">
              📦 Stato Modpack:
            </Text>
            <Badge colorPalette={jarStatus.hasJar ? 'green' : 'orange'} variant="solid">
              {jarStatus.hasJar ? 'Installato' : 'Non trovato'}
            </Badge>
            {jarStatus.hasJar && jarStatus.jarName && (
              <>
                <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.400">
                  {jarStatus.jarName}
                </Text>
                {jarStatus.jarType && (
                  <Badge colorPalette="blue" variant="outline">
                    {jarStatus.jarType.toUpperCase()}
                  </Badge>
                )}
              </>
            )}
          </HStack>
          {!jarStatus.hasJar && (
            <Text fontSize={{ base: 'xs', md: 'sm' }} color="orange.300" mt={2}>
              💡 Vai alla pagina Modpack per installare un server prima di avviarlo
            </Text>
          )}
        </GlassCard>
      )}

      {/* Main Console Grid */}
      <Box 
        display="grid" 
        gridTemplateColumns={{ base: '1fr', lg: '300px 1fr' }} 
        gap={6}
        alignItems="start"
      >
        {/* Server Controls */}
        <QuickActionCard
          title="Controllo Server"
          description="Gestisci lo stato del server"
          icon="🎮"
          gradient="linear(135deg, blue.500/10, cyan.500/10)"
        >
          <Stack gap={3}>
            <GlassButton
              size={{ base: 'sm', md: 'md' }}
              onClick={() => void power(serverRunning ? 'stop' : 'start')}
              disabled={busy || (!serverRunning && !jarStatus?.canStart)}
              w="100%"
              minH="44px"
            >
              {serverRunning ? '⏹️ Ferma Server' : '▶️ Avvia Server'}
            </GlassButton>
            
            <GlassButton
              size={{ base: 'sm', md: 'md' }}
              onClick={() => void power('restart')}
              disabled={busy || !serverRunning}
              w="100%"
              minH="44px"
            >
              🔄 Riavvia Server
            </GlassButton>
            
            <GlassButton
              size={{ base: 'sm', md: 'md' }}
              onClick={clearConsoleOutput}
              disabled={busy}
              w="100%"
              minH="44px"
              variant="outline"
            >
              🗑️ Pulisci Console
            </GlassButton>
          </Stack>
        </QuickActionCard>

        {/* Console Output and Input */}
        <GlassCard p={6}>
          <Text fontSize="lg" fontWeight="bold" mb={4} color="accent.fg">
            💻 Console Output
          </Text>

          {/* Command Input */}
          <Box as="form" onSubmit={handleSubmit} mb={4}>
            <HStack gap={3}>
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                disabled={busy || !serverRunning}
                placeholder={serverRunning ? "Inserisci comando..." : "Server non avviato"}
                flex="1"
                minH="44px"
                fontSize={{ base: 'sm', md: 'md' }}
              />
              <GlassButton
                type="submit"
                size={{ base: 'sm', md: 'md' }}
                disabled={busy || !serverRunning}
                minH="44px"
                px={6}
              >
                Invia
              </GlassButton>
            </HStack>
          </Box>

          {/* Output Area */}
          <Textarea
            ref={outputRef}
            readOnly
            rows={20}
            value={output}
            resize="vertical"
            fontSize={{ base: 'xs', md: 'sm' }}
            fontFamily="monospace"
            bg="blackAlpha.300"
            borderColor="whiteAlpha.300"
            _focus={{ borderColor: 'accent.fg' }}
            placeholder="Output della console apparirà qui..."
          />
        </GlassCard>
      </Box>
    </Box>
  )
}
