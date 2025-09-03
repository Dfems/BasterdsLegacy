import { useMemo, useState, type JSX } from 'react'

import { Box, Grid, GridItem, Heading, HStack, Text } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'

type Status = {
  state: 'RUNNING' | 'STOPPED' | 'CRASHED'
  pid: number | null
  uptimeMs: number
  cpu: number
  memMB: number
}

const fmtUptime = (ms: number): string => {
  const sec = Math.floor(ms / 1000)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h}h ${m}m ${s}s`
}

const DashboardPage = (): JSX.Element => {
  const qc = useQueryClient()
  const [note, setNote] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
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
      setNote({ type: 'success', text: `Operazione ${action} avviata` })
      void qc.invalidateQueries({ queryKey: ['status'] })
    },
    onError: (error, action) => {
      setNote({ type: 'error', text: `Errore ${action}: ${error.message}` })
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

  return (
    <Box p={6}>
      <Heading mb={4}>Dashboard</Heading>
      {err && (
        <Text color="accent.danger" mb={4}>
          {err}
        </Text>
      )}
      {note && (
        <Text color={note.type === 'success' ? 'accent.success' : 'accent.danger'} mb={2}>
          {note.text}
        </Text>
      )}
      <Grid
        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
        gridAutoRows="1fr"
        gap={4}
        alignItems="stretch"
      >
        <GlassCard h="100%" display="flex" flexDirection="column" justifyContent="space-between">
          <Text fontWeight="bold">State</Text>
          <Text color={stateColor}>{data?.state ?? (isFetching ? 'Loading…' : 'Unknown')}</Text>
          <Text color="textMuted">PID: {data?.pid ?? '-'}</Text>
        </GlassCard>
        <GlassCard h="100%" display="flex" flexDirection="column" justifyContent="space-between">
          <Text fontWeight="bold">CPU</Text>
          <Text>{data ? `${(data.cpu * 100).toFixed(1)}%` : '-'}</Text>
        </GlassCard>
        <GlassCard h="100%" display="flex" flexDirection="column" justifyContent="space-between">
          <Text fontWeight="bold">Memory</Text>
          <Text>{data ? `${data.memMB} MB` : '-'}</Text>
        </GlassCard>
        <GlassCard h="100%" display="flex" flexDirection="column" justifyContent="space-between">
          <Text fontWeight="bold">Uptime</Text>
          <Text>{data ? fmtUptime(data.uptimeMs) : '-'}</Text>
        </GlassCard>
        <GridItem colSpan={{ base: 1, md: 2, lg: 3 }}>
          <GlassCard h="100%" display="flex" flexDirection="column" justifyContent="space-between">
            <Text fontWeight="bold" mb={2}>
              Azioni
            </Text>
            <HStack gap={2} wrap="wrap">
              <GlassButton
                size="sm"
                onClick={() => powerMutation.mutate('start')}
                disabled={data?.state === 'RUNNING' || powerMutation.isPending}
                loading={powerMutation.isPending}
                w="130px"
              >
                Start
              </GlassButton>
              <GlassButton
                size="sm"
                onClick={() => powerMutation.mutate('stop')}
                disabled={data?.state !== 'RUNNING' || powerMutation.isPending}
                loading={powerMutation.isPending}
                w="130px"
              >
                Stop
              </GlassButton>
              <GlassButton
                size="sm"
                onClick={() => powerMutation.mutate('restart')}
                disabled={data?.state !== 'RUNNING' || powerMutation.isPending}
                loading={powerMutation.isPending}
                w="130px"
              >
                Restart
              </GlassButton>
            </HStack>
          </GlassCard>
        </GridItem>
      </Grid>
    </Box>
  )
}

export default DashboardPage
