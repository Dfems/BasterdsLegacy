import { useMemo, useState, type JSX } from 'react'

import { Box, Button, Grid, Heading, HStack, Text } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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
        return 'green.500'
      case 'CRASHED':
        return 'red.500'
      case 'STOPPED':
      default:
        return 'gray.500'
    }
  }, [data?.state])

  return (
    <Box p={6}>
      <Heading mb={4}>Dashboard</Heading>
      {err && (
        <Text color="red.500" mb={4}>
          {err}
        </Text>
      )}
      {note && (
        <Text color={note.type === 'success' ? 'green.500' : 'red.500'} mb={2}>
          {note.text}
        </Text>
      )}
      <Grid columns={3} gap={4}>
        <Box p={4} borderWidth="1px" rounded="md">
          <Text fontWeight="bold">State</Text>
          <Text color={stateColor}>{data?.state ?? (isFetching ? 'Loading…' : 'Unknown')}</Text>
          <Text color="gray.500">PID: {data?.pid ?? '-'}</Text>
        </Box>
        <Box p={4} borderWidth="1px" rounded="md">
          <Text fontWeight="bold">CPU</Text>
          <Text>{data ? `${(data.cpu * 100).toFixed(1)}%` : '-'}</Text>
        </Box>
        <Box p={4} borderWidth="1px" rounded="md">
          <Text fontWeight="bold">Memory</Text>
          <Text>{data ? `${data.memMB} MB` : '-'}</Text>
        </Box>
        <Box p={4} borderWidth="1px" rounded="md">
          <Text fontWeight="bold">Uptime</Text>
          <Text>{data ? fmtUptime(data.uptimeMs) : '-'}</Text>
        </Box>
        <Box p={4} borderWidth="1px" rounded="md">
          <Text fontWeight="bold" mb={2}>
            Azioni
          </Text>
          <HStack gap={2} wrap="wrap">
            <Button
              size="sm"
              onClick={() => powerMutation.mutate('start')}
              disabled={data?.state === 'RUNNING' || powerMutation.isPending}
              loading={powerMutation.isPending}
            >
              Start
            </Button>
            <Button
              size="sm"
              onClick={() => powerMutation.mutate('stop')}
              disabled={data?.state !== 'RUNNING' || powerMutation.isPending}
              loading={powerMutation.isPending}
            >
              Stop
            </Button>
            <Button
              size="sm"
              onClick={() => powerMutation.mutate('restart')}
              disabled={data?.state !== 'RUNNING' || powerMutation.isPending}
              loading={powerMutation.isPending}
            >
              Restart
            </Button>
          </HStack>
        </Box>
      </Grid>
    </Box>
  )
}

export default DashboardPage
