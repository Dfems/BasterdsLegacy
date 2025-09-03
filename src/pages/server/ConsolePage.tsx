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
import useLanguage from '@/shared/hooks/useLanguage'

type WsMsg = { type?: string; data?: unknown }

export default function ConsolePage(): JSX.Element {
  const { t } = useLanguage()
  const { token } = useContext(AuthContext)

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
        await fetch('/api/power', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        if (action === 'start') setOutput((o) => o + 'Avvio in corso...\n')
        if (action === 'stop') setOutput((o) => o + 'Arresto in corso...\n')
        if (action === 'restart') setOutput((o) => o + 'Riavvio in corso...\n')
        await fetchStatus()
      } catch (e) {
        setOutput((o) => o + `Errore power: ${(e as Error).message}\n`)
      } finally {
        setBusy(false)
      }
    },
    [fetchStatus]
  )

  const clearOutput = () => setOutput('')

  return (
    <Box p={{ base: 4, md: 6 }}> {/* Padding responsive */}
      <Heading mb={2} fontSize={{ base: 'md', md: 'lg' }}>{t.consoleTitle}</Heading> {/* Font size responsive */}
      <HStack mb={4} gap={3} align="center" wrap="wrap">
        <Text fontSize={{ base: 'sm', md: 'md' }}>Stato server:</Text> {/* Font size responsive */}
        <Badge colorPalette={serverRunning ? 'green' : 'red'} variant="solid">
          {serverRunning ? 'Avviato' : 'Spento'}
        </Badge>
      </HStack>

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
          <Stack gap={3}> {/* Aumentato gap per mobile */}
            <GlassButton
              size={{ base: 'sm', md: 'md' }} // Size responsive
              onClick={() => void power(serverRunning ? 'stop' : 'start')}
              disabled={busy}
              minH="44px" // Touch target minimo
            >
              {serverRunning ? 'Stop' : 'Start'}
            </GlassButton>
            <GlassButton
              size={{ base: 'sm', md: 'md' }} // Size responsive
              onClick={() => void power('restart')}
              disabled={busy || !serverRunning}
              minH="44px" // Touch target minimo
            >
              Restart
            </GlassButton>
            <GlassButton 
              size={{ base: 'sm', md: 'md' }} // Size responsive
              onClick={clearOutput} 
              disabled={busy}
              minH="44px" // Touch target minimo
            >
              Clear
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
                minWidth: '100%' // Su mobile va su riga separata
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
              Invia
            </GlassButton>
          </Box>

          <Heading size={{ base: 'sm', md: 'md' }} mb={2}> {/* Font size responsive */}
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
