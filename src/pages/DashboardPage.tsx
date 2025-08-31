import { useEffect, useMemo, useState, type JSX } from 'react'

import { Box, Button, Grid, Heading, HStack, Text } from '@chakra-ui/react'

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
  const [data, setData] = useState<Status | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('/api/status')
        if (!r.ok) throw new Error('status error')
        setData((await r.json()) as Status)
        setErr(null)
      } catch (e) {
        setErr((e as Error).message)
      }
    }
    void load()
    const timer = window.setInterval(load, 3000)
    return () => {
      window.clearInterval(timer)
    }
  }, [])

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
      <Grid columns={3} gap={4}>
        <Box p={4} borderWidth="1px" rounded="md">
          <Text fontWeight="bold">State</Text>
          <Text color={stateColor}>{data?.state ?? 'Unknown'}</Text>
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
              onClick={() =>
                fetch('/api/power', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'start' }),
                }).then(() => void 0)
              }
              disabled={data?.state === 'RUNNING'}
            >
              Start
            </Button>
            <Button
              size="sm"
              onClick={() =>
                fetch('/api/power', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'stop' }),
                }).then(() => void 0)
              }
              disabled={data?.state !== 'RUNNING'}
            >
              Stop
            </Button>
            <Button
              size="sm"
              onClick={() =>
                fetch('/api/power', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'restart' }),
                }).then(() => void 0)
              }
              disabled={data?.state !== 'RUNNING'}
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
