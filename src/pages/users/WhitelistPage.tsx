import { useMemo, useState, type JSX } from 'react'

import { Box, Heading, HStack, Input, Text } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'

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

      <GlassCard mb={4}>
        <HStack gap={3} wrap="wrap">
          <Input
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            width="auto"
          />
          <GlassButton
            onClick={() => name && mutate.mutate({ action: 'add', player: name })}
            disabled={!name}
          >
            Aggiungi
          </GlassButton>
        </HStack>
      </GlassCard>

      {isLoading && <Text>Caricamento…</Text>}
      {isError && <Text color="red">Errore</Text>}

      <GlassCard as="ul" p={2} style={{ listStyle: 'none', padding: 0 }}>
        {players.map((p) => (
          <HStack as="li" key={p} justify="space-between" mb={2}>
            <span>{p}</span>
            <GlassButton
              size="xs"
              colorScheme="red"
              onClick={() => mutate.mutate({ action: 'remove', player: p })}
            >
              Rimuovi
            </GlassButton>
          </HStack>
        ))}
      </GlassCard>
    </Box>
  )
}
