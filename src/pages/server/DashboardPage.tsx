import { useMemo, useState, type JSX } from 'react'

import { Box, Grid, GridItem, Heading, HStack, Text } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
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
  const { dashboard, common } = useLanguage()
  const qc = useQueryClient()
  const [note, setNote] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [requiresRestart, setRequiresRestart] = useState(false)
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

  return (
    <Box p={{ base: 4, md: 6 }}>
      {' '}
      {/* Padding responsive */}
      <Heading mb={4} fontSize={{ base: 'md', md: 'lg' }}>
        {dashboard.title}
      </Heading>{' '}
      {/* Font size responsive */}
      {err && (
        <Text color="accent.danger" mb={4} fontSize={{ base: 'sm', md: 'md' }}>
          {' '}
          {/* Font size responsive */}
          {err}
        </Text>
      )}
      {note && (
        <Text
          color={note.type === 'success' ? 'accent.success' : 'accent.danger'}
          mb={2}
          fontSize={{ base: 'sm', md: 'md' }} // Font size responsive
        >
          {note.text}
        </Text>
      )}
      <Grid
        templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} // Aumentato per più cards
        gridAutoRows="1fr"
        gap={{ base: 3, md: 4 }} // Gap responsive
        alignItems="stretch"
      >
        <GlassCard
          h="100%"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          p={{ base: 3, md: 4 }}
        >
          <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
            {dashboard.state}
          </Text>
          <Text color={stateColor} fontSize={{ base: 'sm', md: 'md' }}>
            {data?.state
              ? getStateText(data.state)
              : isFetching
                ? common.loading
                : dashboard.unknown}
          </Text>
          <Text color="textMuted" fontSize={{ base: 'xs', md: 'sm' }}>
            PID: {data?.pid ?? '-'}
          </Text>
        </GlassCard>

        <GlassCard
          h="100%"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          p={{ base: 3, md: 4 }}
        >
          <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
            {dashboard.cpu}
          </Text>
          <Text fontSize={{ base: 'sm', md: 'md' }}>{data ? `${data.cpu.toFixed(1)}%` : '-'}</Text>
        </GlassCard>

        <GlassCard
          h="100%"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          p={{ base: 3, md: 4 }}
        >
          <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
            {dashboard.processMemory}
          </Text>
          <Text fontSize={{ base: 'sm', md: 'md' }}>{data ? `${data.memMB} MB` : '-'}</Text>
        </GlassCard>

        <GlassCard
          h="100%"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          p={{ base: 3, md: 4 }}
        >
          <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
            {dashboard.uptime}
          </Text>
          <Text fontSize={{ base: 'sm', md: 'md' }}>{data ? fmtUptime(data.uptimeMs) : '-'}</Text>
        </GlassCard>

        {/* Nuove cards per le metriche del sistema */}
        <GlassCard
          h="100%"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          p={{ base: 3, md: 4 }}
        >
          <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
            {dashboard.systemMemory}
          </Text>
          <Text fontSize={{ base: 'sm', md: 'md' }}>
            {data?.systemMemory
              ? `${data.systemMemory.usedGB}/${data.systemMemory.totalGB} GB`
              : '-'}
          </Text>
          <Text color="textMuted" fontSize={{ base: 'xs', md: 'sm' }}>
            {data?.systemMemory
              ? `${Math.round((data.systemMemory.usedGB / data.systemMemory.totalGB) * 100)}% ${dashboard.utilized}`
              : ''}
          </Text>
        </GlassCard>

        <GlassCard
          h="100%"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          p={{ base: 3, md: 4 }}
        >
          <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
            {dashboard.diskStorage}
          </Text>
          <Text fontSize={{ base: 'sm', md: 'md' }}>
            {data?.disk && data.disk.totalGB > 0
              ? `${data.disk.usedGB}/${data.disk.totalGB} GB`
              : dashboard.notAvailable}
          </Text>
          <Text color="textMuted" fontSize={{ base: 'xs', md: 'sm' }}>
            {data?.disk && data.disk.totalGB > 0
              ? `${Math.round((data.disk.usedGB / data.disk.totalGB) * 100)}% ${dashboard.utilized_masculine}`
              : dashboard.checkingSpace}
          </Text>
        </GlassCard>

        <GlassCard
          h="100%"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          p={{ base: 3, md: 4 }}
        >
          <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
            {dashboard.tickTime}
          </Text>

          {/* Se RCON non è disponibile, mostra il messaggio e il pulsante */}
          {!data?.rconAvailable ? (
            <>
              <Text fontSize={{ base: 'sm', md: 'md' }} color="textMuted">
                {dashboard.rconRequired}
              </Text>
              <GlassButton
                size="sm"
                onClick={() => enableRconMutation.mutate()}
                loading={enableRconMutation.isPending}
                mt={2}
              >
                {dashboard.enableRcon}
              </GlassButton>
            </>
          ) : (
            <>
              <Text
                fontSize={{ base: 'sm', md: 'md' }}
                color={
                  data?.state !== 'RUNNING'
                    ? 'textMuted'
                    : data?.tickTimeMs && data.tickTimeMs <= 50
                      ? 'accent.success'
                      : data?.tickTimeMs && data.tickTimeMs <= 55
                        ? 'yellow.400'
                        : 'accent.danger'
                }
              >
                {data?.tickTimeMs && data.state === 'RUNNING'
                  ? `${data.tickTimeMs.toFixed(1)} ms`
                  : '-'}
              </Text>
              <Text color="textMuted" fontSize={{ base: 'xs', md: 'sm' }}>
                {data?.state === 'RUNNING'
                  ? data?.tickTimeMs && data.tickTimeMs <= 50
                    ? dashboard.perfect
                    : data?.tickTimeMs && data.tickTimeMs <= 55
                      ? dashboard.good
                      : data?.tickTimeMs && data.tickTimeMs <= 70
                        ? dashboard.acceptable
                        : dashboard.slow
                  : dashboard.notAvailable}
              </Text>
            </>
          )}
        </GlassCard>

        <GlassCard
          h="100%"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          p={{ base: 3, md: 4 }}
        >
          <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
            {dashboard.playersOnline}
          </Text>

          {!data?.rconAvailable ? (
            <Text fontSize={{ base: 'sm', md: 'md' }} color="textMuted">
              {dashboard.rconRequired}
            </Text>
          ) : (
            <Text fontSize={{ base: 'sm', md: 'md' }}>
              {data?.players ? `${data.players.online}/${data.players.max}` : '-'}
            </Text>
          )}

          <Text color="textMuted" fontSize={{ base: 'xs', md: 'sm' }}>
            {data?.state === 'RUNNING' && data?.rconAvailable
              ? dashboard.online
              : dashboard.offline}
          </Text>
        </GlassCard>

        <GridItem colSpan={{ base: 1, sm: 2, lg: 4 }}>
          <GlassCard
            h="100%"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            p={{ base: 3, md: 4 }}
          >
            <Text fontWeight="bold" mb={2} fontSize={{ base: 'sm', md: 'md' }}>
              {dashboard.actions}
            </Text>

            {/* Messaggio di riavvio necessario se presente */}
            {requiresRestart && (
              <Text
                color="orange.400"
                fontSize={{ base: 'xs', md: 'sm' }}
                mb={2}
                fontWeight="semibold"
              >
                {dashboard.restartRequired}
              </Text>
            )}

            <HStack gap={2} wrap="wrap" justify={{ base: 'center', sm: 'flex-start' }}>
              <GlassButton
                size={{ base: 'sm', md: 'md' }}
                onClick={() => powerMutation.mutate('start')}
                disabled={data?.state === 'RUNNING' || powerMutation.isPending}
                loading={powerMutation.isPending}
                w={{ base: '100%', sm: '130px' }}
                minH="44px"
              >
                {dashboard.start}
              </GlassButton>
              <GlassButton
                size={{ base: 'sm', md: 'md' }}
                onClick={() => powerMutation.mutate('stop')}
                disabled={data?.state !== 'RUNNING' || powerMutation.isPending}
                loading={powerMutation.isPending}
                w={{ base: '100%', sm: '130px' }}
                minH="44px"
              >
                {dashboard.stop}
              </GlassButton>
              <GlassButton
                size={{ base: 'sm', md: 'md' }}
                onClick={() => powerMutation.mutate('restart')}
                disabled={data?.state !== 'RUNNING' || powerMutation.isPending}
                loading={powerMutation.isPending}
                w={{ base: '100%', sm: '130px' }}
                minH="44px"
                colorPalette={requiresRestart ? 'orange' : undefined}
              >
                {requiresRestart ? dashboard.restartServer : dashboard.restart}
              </GlassButton>
            </HStack>
          </GlassCard>
        </GridItem>
      </Grid>
    </Box>
  )
}

export default DashboardPage
