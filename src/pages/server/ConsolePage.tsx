import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type JSX,
} from 'react'

import { Badge, Box, HStack, Heading, Input, Stack, Text, Textarea } from '@chakra-ui/react'

import AuthContext from '@/entities/user/AuthContext'
import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import useLanguage from '@/shared/hooks/useLanguage'
import { useServerJarStatus } from '@/shared/hooks/useServerJarStatus'

type WsMsg = { type?: string; data?: unknown }

export default function ConsolePage(): JSX.Element {
  const { t, server } = useLanguage()
  const { token } = useContext(AuthContext)
  const { data: jarStatus, isLoading: jarLoading } = useServerJarStatus()

  const [command, setCommand] = useState('')
  const [output, setOutput] = useState('')
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
            setOutput((o) => o + msg.data + '\n')
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
  }, [token, fetchStatus])

  const sendCmd = useCallback((cmd: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    const payload = JSON.stringify({ type: 'cmd', data: cmd })
    wsRef.current.send(payload)
    setOutput((o) => o + `> ${cmd}\n`)
  }, [])

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
            (o) =>
              o + 'Errore: Nessun JAR del server trovato. Installa un modpack prima di avviare.\n'
          )
          return
        }

        await fetch('/api/power', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        if (action === 'start') setOutput((o) => o + server.startingMessage + '\n')
        if (action === 'stop') setOutput((o) => o + server.stoppingMessage + '\n')
        if (action === 'restart') setOutput((o) => o + server.restartingMessage + '\n')
        await fetchStatus()
      } catch (e) {
        setOutput((o) => o + server.powerError.replace('{error}', (e as Error).message) + '\n')
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
    ]
  )

  const clearOutput = () => setOutput('')

  return (
    <Box p={{ base: 4, md: 6 }}>
      {' '}
      {/* Padding responsive */}
      <Heading mb={2} fontSize={{ base: 'md', md: 'lg' }}>
        {t.consoleTitle}
      </Heading>{' '}
      {/* Font size responsive */}
      {/* Stato Server */}
      <HStack mb={4} gap={3} align="center" wrap="wrap">
        <Text fontSize={{ base: 'sm', md: 'md' }}>{server.serverStatus}</Text>{' '}
        {/* Font size responsive */}
        <Badge colorPalette={serverRunning ? 'green' : 'red'} variant="solid">
          {serverRunning ? server.running : server.stopped}
        </Badge>
      </HStack>
      {/* Stato JAR/Modpack */}
      {!jarLoading && jarStatus && (
        <GlassCard mb={4} p={{ base: 3, md: 4 }}>
          <HStack gap={3} align="center" wrap="wrap">
            <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold">
              Stato Modpack:
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
      <Stack direction={{ base: 'column', md: 'row' }} gap={4} align="stretch">
        <Box
          p={4}
          borderWidth="1px"
          rounded="md"
          bg="whiteAlpha.100"
          borderColor="whiteAlpha.200"
          minW={{ md: '220px' }}
          boxShadow="md"
          style={{ backdropFilter: 'blur(10px) saturate(120%)' }}
        >
          <Stack gap={3}>
            {' '}
            {/* Aumentato gap per mobile */}
            <GlassButton
              size={{ base: 'sm', md: 'md' }} // Size responsive
              onClick={() => void power(serverRunning ? 'stop' : 'start')}
              disabled={busy || (!serverRunning && !jarStatus?.canStart)}
              minH="44px" // Touch target minimo
            >
              {serverRunning ? server.stop : server.start}
            </GlassButton>
            <GlassButton
              size={{ base: 'sm', md: 'md' }} // Size responsive
              onClick={() => void power('restart')}
              disabled={busy || !serverRunning}
              minH="44px" // Touch target minimo
            >
              {server.restart}
            </GlassButton>
            <GlassButton
              size={{ base: 'sm', md: 'md' }} // Size responsive
              onClick={clearOutput}
              disabled={busy}
              minH="44px" // Touch target minimo
            >
              {server.clear}
            </GlassButton>
          </Stack>
        </Box>

        <Box
          flex="1"
          p={4}
          borderWidth="1px"
          rounded="md"
          bg="whiteAlpha.100"
          borderColor="whiteAlpha.200"
          boxShadow="md"
          style={{ backdropFilter: 'blur(10px) saturate(120%)' }}
        >
          <Box as="form" onSubmit={handleSubmit} mb={3} display="flex" gap={2} flexWrap="wrap">
            <label
              htmlFor="command"
              style={{
                alignSelf: 'center',
                fontSize: '14px', // Font size specifico per label
                minWidth: '100%', // Su mobile va su riga separata
              }}
            >
              {t.commandLabel}
            </label>
            <Input
              id="command"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={busy || !serverRunning}
              flex="1"
              minW={{ base: '100%', sm: '280px' }}
              minH="44px" // Touch target minimo
              fontSize={{ base: 'sm', md: 'md' }} // Font size responsive
            />
            <GlassButton
              type="submit"
              size={{ base: 'sm', md: 'md' }} // Size responsive
              disabled={busy || !serverRunning}
              minH="44px" // Touch target minimo
              w={{ base: '100%', sm: 'auto' }} // Full width su mobile
            >
              {server.send}
            </GlassButton>
          </Box>

          <Heading size={{ base: 'sm', md: 'md' }} mb={2}>
            {' '}
            {/* Font size responsive */}
            {t.consoleOutputTitle}
          </Heading>
          <Textarea
            ref={outputRef}
            readOnly
            rows={15} // Valore fisso, ottimizzato per mobile
            value={output}
            resize="vertical"
            fontSize={{ base: 'xs', md: 'sm' }} // Font size responsive per output
          />
        </Box>
      </Stack>
    </Box>
  )
}
