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
    <Box p={{ base: 4, md: 6 }}> {/* Padding responsive */}
      <Heading mb={4} fontSize={{ base: 'md', md: 'lg' }}>Dashboard</Heading> {/* Font size responsive */}
      {err && (
        <Text color="accent.danger" mb={4} fontSize={{ base: 'sm', md: 'md' }}> {/* Font size responsive */}
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
        templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} // Migliorato breakpoint per mobile
        gridAutoRows="1fr"
        gap={{ base: 3, md: 4 }} // Gap responsive
        alignItems="stretch"
      >
        <GlassCard h="100%" display="flex" flexDirection="column" justifyContent="space-between" p={{ base: 3, md: 4 }}> {/* Padding responsive */}
          <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>State</Text> {/* Font size responsive */}
          <Text color={stateColor} fontSize={{ base: 'sm', md: 'md' }}>{data?.state ?? (isFetching ? 'Loading…' : 'Unknown')}</Text>
          <Text color="textMuted" fontSize={{ base: 'xs', md: 'sm' }}>PID: {data?.pid ?? '-'}</Text> {/* Font size responsive */}
        </GlassCard>
        <GlassCard h="100%" display="flex" flexDirection="column" justifyContent="space-between" p={{ base: 3, md: 4 }}> {/* Padding responsive */}
          <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>CPU</Text> {/* Font size responsive */}
          <Text fontSize={{ base: 'sm', md: 'md' }}>{data ? `${(data.cpu * 100).toFixed(1)}%` : '-'}</Text> {/* Font size responsive */}
        </GlassCard>
        <GlassCard h="100%" display="flex" flexDirection="column" justifyContent="space-between" p={{ base: 3, md: 4 }}> {/* Padding responsive */}
          <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>Memory</Text> {/* Font size responsive */}
          <Text fontSize={{ base: 'sm', md: 'md' }}>{data ? `${data.memMB} MB` : '-'}</Text> {/* Font size responsive */}
        </GlassCard>
        <GlassCard h="100%" display="flex" flexDirection="column" justifyContent="space-between" p={{ base: 3, md: 4 }}> {/* Padding responsive */}
          <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>Uptime</Text> {/* Font size responsive */}
          <Text fontSize={{ base: 'sm', md: 'md' }}>{data ? fmtUptime(data.uptimeMs) : '-'}</Text> {/* Font size responsive */}
        </GlassCard>
        <GridItem colSpan={{ base: 1, sm: 2, lg: 3 }}> {/* Migliorato colSpan per mobile */}
          <GlassCard h="100%" display="flex" flexDirection="column" justifyContent="space-between" p={{ base: 3, md: 4 }}> {/* Padding responsive */}
            <Text fontWeight="bold" mb={2} fontSize={{ base: 'sm', md: 'md' }}> {/* Font size responsive */}
              Azioni
            </Text>
            <HStack gap={2} wrap="wrap" justify={{ base: 'center', sm: 'flex-start' }}> {/* Centrato su mobile */}
              <GlassButton
                size={{ base: 'sm', md: 'md' }} // Size responsive
                onClick={() => powerMutation.mutate('start')}
                disabled={data?.state === 'RUNNING' || powerMutation.isPending}
                loading={powerMutation.isPending}
                w={{ base: '100%', sm: '130px' }} // Full width su mobile
                minH="44px" // Touch target minimo
              >
                Start
              </GlassButton>
              <GlassButton
                size={{ base: 'sm', md: 'md' }} // Size responsive
                onClick={() => powerMutation.mutate('stop')}
                disabled={data?.state !== 'RUNNING' || powerMutation.isPending}
                loading={powerMutation.isPending}
                w={{ base: '100%', sm: '130px' }} // Full width su mobile
                minH="44px" // Touch target minimo
              >
                Stop
              </GlassButton>
              <GlassButton
                size={{ base: 'sm', md: 'md' }} // Size responsive
                onClick={() => powerMutation.mutate('restart')}
                disabled={data?.state !== 'RUNNING' || powerMutation.isPending}
                loading={powerMutation.isPending}
                w={{ base: '100%', sm: '130px' }} // Full width su mobile
                minH="44px" // Touch target minimo
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
