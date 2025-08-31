import { useMemo, useState, type JSX } from 'react'

import { Box, Button, Heading, HStack, Input, Text } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export default function WhitelistPage(): JSX.Element {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const { data, isLoading, isError } = useQuery<{ players: string[] }>({
    queryKey: ['whitelist'],
    queryFn: async () => {
      const r = await fetch('/api/whitelist')
      if (!r.ok) throw new Error('Failed to load')
      return (await r.json()) as { players: string[] }
    },
    staleTime: 5_000,
  })

  const mutate = useMutation({
    mutationFn: async ({ action, player }: { action: 'add' | 'remove'; player: string }) => {
      const r = await fetch('/api/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, player }),
      })
      if (!r.ok) throw new Error('Change failed')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whitelist'] }),
  })

  const players = useMemo(() => data?.players ?? [], [data])

  return (
    <Box p={6}>
      <Heading mb={4}>Whitelist</Heading>

      <HStack mb={4} gap={3} wrap="wrap">
        <Input
          placeholder="Username"
          value={name}
          onChange={(e) => setName(e.target.value)}
          width="auto"
        />
        <Button
          onClick={() => name && mutate.mutate({ action: 'add', player: name })}
          disabled={!name}
        >
          Aggiungi
        </Button>
      </HStack>

      {isLoading && <Text>Caricamento…</Text>}
      {isError && <Text color="red">Errore</Text>}

      <Box as="ul" style={{ listStyle: 'none', padding: 0 }}>
        {players.map((p) => (
          <Box as="li" key={p} display="flex" alignItems="center" gap={8} mb={2}>
            <span>{p}</span>
            <Button
              size="xs"
              colorPalette="red"
              onClick={() => mutate.mutate({ action: 'remove', player: p })}
            >
              Rimuovi
            </Button>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
