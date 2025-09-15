import { useMemo, useState, type JSX } from 'react'

import { Box, Grid, HStack, Text } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import { ModernHeader } from '@/shared/components/ModernHeader'
import { ModernTabs } from '@/shared/components/ModernTabs'
import { StatsCard } from '@/shared/components/StatsCard'
import useLanguage from '@/shared/hooks/useLanguage'

type Status = {
  state: 'RUNNING' | 'STOPPED' | 'CRASHED'
  pid: number | null
  uptimeMs: number
  cpu: number
  memMB: number
  running: boolean
  // Nuove metriche di sistema
  disk: {
    usedGB: number
    totalGB: number
    freeGB: number
  }
  systemMemory: {
    totalGB: number
    freeGB: number
    usedGB: number
  }
  tickTimeMs: number // Cambiato da tps a tickTimeMs
  players: {
    online: number
    max: number
  }
  rconAvailable: boolean // Nuovo campo per indicare se RCON è disponibile
}

const fmtUptime = (ms: number): string => {
  const sec = Math.floor(ms / 1000)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h}h ${m}m ${s}s`
}

const DashboardPage = (): JSX.Element => {
  const { dashboard, common, ui } = useLanguage()
  const qc = useQueryClient()
  const [note, setNote] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [requiresRestart, setRequiresRestart] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const { data, error, isFetching } = useQuery({
    queryKey: ['status'],
    queryFn: async (): Promise<Status> => {
      const r = await fetch('/api/status')
      if (!r.ok) throw new Error('status error')
      return (await r.json()) as Status
    },
    refetchInterval: 3000,
    staleTime: 1000,
  })
  const err = (error as Error | null)?.message ?? null

  const powerMutation = useMutation<{ ok: true }, Error, 'start' | 'stop' | 'restart'>({
    mutationFn: async (action: 'start' | 'stop' | 'restart') => {
      const r = await fetch('/api/power', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!r.ok) throw new Error('power error')
      return (await r.json()) as { ok: true }
    },
    onSuccess: (_data, action) => {
      setNote({ type: 'success', text: dashboard.operationStarted.replace('{action}', action) })
      // Reset requiresRestart flag when server is restarted
      if (action === 'restart') {
        setRequiresRestart(false)
      }
      void qc.invalidateQueries({ queryKey: ['status'] })
    },
    onError: (error, action) => {
      setNote({
        type: 'error',
        text: dashboard.operationError
          .replace('{action}', action)
          .replace('{error}', error.message),
      })
    },
  })

  const enableRconMutation = useMutation<
    { success: boolean; rconPassword?: string; note?: string; requiresRestart?: boolean },
    Error
  >({
    mutationFn: async () => {
      // Non inviare Content-Type: application/json senza body: Fastify risponderebbe 400 (empty JSON body)
      const r = await fetch('/api/settings/enable-rcon', {
        method: 'POST',
      })
      if (!r.ok) throw new Error('Failed to enable RCON')
      return await r.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        let message = dashboard.rconEnabled
        if (data.rconPassword) {
          message += ` Password: ${data.rconPassword}.`
        }
        if (data.requiresRestart) {
          message += ` ${dashboard.restartRequired}`
          setRequiresRestart(true)
        }

        setNote({
          type: 'success',
          text: message,
        })
        void qc.invalidateQueries({ queryKey: ['status'] })
      }
    },
    onError: (error) => {
      setNote({
        type: 'error',
        text: dashboard.rconEnableError.replace('{error}', error.message),
      })
    },
  })

  const stateColor = useMemo(() => {
    switch (data?.state) {
      case 'RUNNING':
        return 'accent.success'
      case 'CRASHED':
        return 'accent.danger'
      case 'STOPPED':
      default:
        return 'textMuted'
    }
  }, [data?.state])

  const getStateText = (state?: string) => {
    switch (state) {
      case 'RUNNING':
        return dashboard.running
      case 'STOPPED':
        return dashboard.stopped
      case 'CRASHED':
        return dashboard.crashed
      default:
        return dashboard.unknown
    }
  }

  const tabs = [
    { id: 'overview', label: ui.overview, icon: '📊' },
    { id: 'performance', label: ui.performance, icon: '⚡' },
    { id: 'monitoring', label: ui.monitoring, icon: '👁️' },
    { id: 'actions', label: 'Controlli', icon: '🎮' },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Grid
            templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
            gap={{ base: 4, md: 6 }}
          >
            <StatsCard
              title={dashboard.state}
              value={
                data?.state
                  ? getStateText(data.state)
                  : isFetching
                    ? common.loading
                    : dashboard.unknown
              }
              icon="🖥️"
              color={stateColor}
              subtitle={data?.pid ? `PID: ${data.pid}` : '-'}
              isLoading={isFetching}
            />

            <StatsCard
              title={dashboard.uptime}
              value={data ? fmtUptime(data.uptimeMs) : '-'}
              icon="⏱️"
              color="purple.400"
              subtitle={data?.state === 'RUNNING' ? 'Server attivo' : 'Server spento'}
              isLoading={isFetching}
            />

            <StatsCard
              title={dashboard.playersOnline}
              value={
                data?.players && data.rconAvailable
                  ? `${data.players.online}/${data.players.max}`
                  : data?.rconAvailable
                    ? '-'
                    : 'N/A'
              }
              icon="👥"
              color="blue.400"
              subtitle={
                !data?.rconAvailable
                  ? dashboard.rconRequired
                  : data?.state === 'RUNNING'
                    ? dashboard.online
                    : dashboard.offline
              }
              action={
                !data?.rconAvailable ? (
                  <GlassButton
                    size="sm"
                    onClick={() => enableRconMutation.mutate()}
                    loading={enableRconMutation.isPending}
                  >
                    {dashboard.enableRcon}
                  </GlassButton>
                ) : undefined
              }
              isLoading={isFetching}
            />

            <StatsCard
              title={dashboard.tickTime}
              value={
                data?.tickTimeMs && data.state === 'RUNNING' && data.rconAvailable
                  ? `${data.tickTimeMs.toFixed(1)} ms`
                  : data?.rconAvailable
                    ? '-'
                    : 'N/A'
              }
              icon="🎯"
              color={
                data?.state !== 'RUNNING' || !data?.rconAvailable
                  ? 'gray.400'
                  : data?.tickTimeMs && data.tickTimeMs <= 50
                    ? 'green.400'
                    : data?.tickTimeMs && data.tickTimeMs <= 55
                      ? 'yellow.400'
                      : 'red.400'
              }
              subtitle={
                !data?.rconAvailable
                  ? dashboard.rconRequired
                  : data?.state === 'RUNNING'
                    ? data?.tickTimeMs && data.tickTimeMs <= 50
                      ? dashboard.perfect
                      : data?.tickTimeMs && data.tickTimeMs <= 55
                        ? dashboard.good
                        : dashboard.slow
                    : dashboard.notAvailable
              }
              action={
                !data?.rconAvailable ? (
                  <GlassButton
                    size="sm"
                    onClick={() => enableRconMutation.mutate()}
                    loading={enableRconMutation.isPending}
                  >
                    {dashboard.enableRcon}
                  </GlassButton>
                ) : undefined
              }
              isLoading={isFetching}
            />
          </Grid>
        )

      case 'performance':
        return (
          <Grid
            templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
            gap={{ base: 4, md: 6 }}
          >
            <StatsCard
              title={dashboard.cpu}
              value={data ? `${data.cpu.toFixed(1)}%` : '-'}
              icon="⚡"
              color="yellow.400"
              trend={data?.cpu ? { value: data.cpu, isPositive: data.cpu < 50 } : undefined}
              isLoading={isFetching}
            />

            <StatsCard
              title={dashboard.processMemory}
              value={data ? `${data.memMB} MB` : '-'}
              icon="🧠"
              color="blue.400"
              isLoading={isFetching}
            />

            <StatsCard
              title={dashboard.systemMemory}
              value={
                data?.systemMemory
                  ? `${data.systemMemory.usedGB}/${data.systemMemory.totalGB} GB`
                  : '-'
              }
              icon="💾"
              color="cyan.400"
              subtitle={
                data?.systemMemory
                  ? `${Math.round((data.systemMemory.usedGB / data.systemMemory.totalGB) * 100)}% ${dashboard.utilized}`
                  : ''
              }
              isLoading={isFetching}
            />

            <StatsCard
              title={dashboard.diskStorage}
              value={
                data?.disk && data.disk.totalGB > 0
                  ? `${data.disk.usedGB}/${data.disk.totalGB} GB`
                  : dashboard.notAvailable
              }
              icon="💿"
              color="purple.400"
              subtitle={
                data?.disk && data.disk.totalGB > 0
                  ? `${Math.round((data.disk.usedGB / data.disk.totalGB) * 100)}% ${dashboard.utilized_masculine}`
                  : dashboard.checkingSpace
              }
              isLoading={isFetching}
            />
          </Grid>
        )

      case 'monitoring':
        return (
          <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={{ base: 4, md: 6 }}>
            <GlassCard p={6}>
              <Text fontSize="lg" fontWeight="bold" mb={4} color="accent.fg">
                📈 {ui.realTime} {ui.monitoring}
              </Text>
              <Text color="textMuted">
                Grafici e monitoraggio avanzato saranno implementati in una versione futura.
              </Text>
            </GlassCard>

            <GlassCard p={6}>
              <Text fontSize="lg" fontWeight="bold" mb={4} color="accent.fg">
                🔔 {ui.alerts}
              </Text>
              <Text color="textMuted">Sistema di allerta e notifiche intelligenti in arrivo.</Text>
            </GlassCard>
          </Grid>
        )

      case 'actions':
        return (
          <GlassCard p={6}>
            <Text fontSize="lg" fontWeight="bold" mb={6} color="accent.fg">
              🎮 Controlli Server
            </Text>

            {/* Messaggio di riavvio necessario se presente */}
            {requiresRestart && (
              <Text
                color="orange.400"
                fontSize={{ base: 'sm', md: 'md' }}
                mb={4}
                fontWeight="semibold"
                p={3}
                bg="orange.500/10"
                borderRadius="md"
                borderLeftWidth="4px"
                borderColor="orange.400"
              >
                ⚠️ {dashboard.restartRequired}
              </Text>
            )}

            <HStack gap={4} wrap="wrap" justify={{ base: 'center', sm: 'flex-start' }}>
              <GlassButton
                size={{ base: 'md', md: 'lg' }}
                onClick={() => powerMutation.mutate('start')}
                disabled={data?.state === 'RUNNING' || powerMutation.isPending}
                loading={powerMutation.isPending}
                w={{ base: '100%', sm: '150px' }}
                minH="56px"
              >
                {dashboard.start}
              </GlassButton>

              <GlassButton
                size={{ base: 'md', md: 'lg' }}
                onClick={() => powerMutation.mutate('stop')}
                disabled={data?.state !== 'RUNNING' || powerMutation.isPending}
                loading={powerMutation.isPending}
                w={{ base: '100%', sm: '150px' }}
                minH="56px"
              >
                {dashboard.stop}
              </GlassButton>

              <GlassButton
                size={{ base: 'md', md: 'lg' }}
                onClick={() => powerMutation.mutate('restart')}
                disabled={data?.state !== 'RUNNING' || powerMutation.isPending}
                loading={powerMutation.isPending}
                w={{ base: '100%', sm: '150px' }}
                minH="56px"
                colorPalette={requiresRestart ? 'orange' : undefined}
              >
                {requiresRestart ? dashboard.restartServer : dashboard.restart}
              </GlassButton>
            </HStack>
          </GlassCard>
        )

      default:
        return null
    }
  }

  return (
    <Box p={{ base: 4, md: 6, lg: 8 }} maxW="7xl" mx="auto">
      {/* Modern Header */}
      <ModernHeader
        title={dashboard.title}
        description="Centro di controllo avanzato per il monitoraggio e la gestione del server"
        emoji="📊"
        gradient="linear(135deg, cyan.500/15, blue.500/15, purple.500/10)"
      />

      {/* Error Message */}
      {err && (
        <GlassCard p={4} mb={6} bg="red.500/10" borderColor="red.500/30">
          <HStack gap={3}>
            <Text fontSize="2xl">❌</Text>
            <Box>
              <Text fontWeight="bold" color="red.400">
                Errore di Connessione
              </Text>
              <Text fontSize="sm" color="textMuted">
                {err}
              </Text>
            </Box>
          </HStack>
        </GlassCard>
      )}

      {/* Success/Error Notification */}
      {note && (
        <GlassCard
          p={4}
          mb={6}
          bg={note.type === 'success' ? 'green.500/10' : 'red.500/10'}
          borderColor={note.type === 'success' ? 'green.500/30' : 'red.500/30'}
        >
          <HStack gap={3}>
            <Text fontSize="2xl">{note.type === 'success' ? '✅' : '❌'}</Text>
            <Text color={note.type === 'success' ? 'green.400' : 'red.400'}>{note.text}</Text>
          </HStack>
        </GlassCard>
      )}

      {/* Modern Tabs */}
      <Box mb={8}>
        <ModernTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} variant="pills" />
      </Box>

      {/* Tab Content */}
      <Box minH="400px">{renderTabContent()}</Box>
    </Box>
  )
}

export default DashboardPage
