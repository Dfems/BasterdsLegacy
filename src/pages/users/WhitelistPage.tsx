import { useMemo, useState, type JSX } from 'react'

import { Box, Heading, HStack, Input, Text } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import useLanguage from '@/shared/hooks/useLanguage'

export default function WhitelistPage(): JSX.Element {
  const { whitelist } = useLanguage()
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
    <Box p={{ base: 4, md: 6 }}>
      {' '}
      {/* Padding responsive */}
      <Heading mb={4} fontSize={{ base: 'md', md: 'lg' }}>
        {whitelist.title}
      </Heading>{' '}
      {/* Font size responsive */}
      <GlassCard mb={4} p={{ base: 3, md: 4 }}>
        {' '}
        {/* Padding responsive */}
        <HStack gap={3} wrap="wrap" justify={{ base: 'center', sm: 'flex-start' }}>
          {' '}
          {/* Centrato su mobile */}
          <Input
            placeholder={whitelist.usernamePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            width="auto"
            data-variant="glass"
            minW={{ base: '200px', sm: 'auto' }} // Larghezza minima su mobile
            minH="44px" // Touch target
            fontSize={{ base: 'sm', md: 'md' }} // Font size responsive
          />
          <GlassButton
            onClick={() => name && mutate.mutate({ action: 'add', player: name })}
            disabled={!name}
            size={{ base: 'sm', md: 'md' }} // Size responsive
            minH="44px" // Touch target
          >
            {whitelist.addUser}
          </GlassButton>
        </HStack>
      </GlassCard>
      {isLoading && <Text fontSize={{ base: 'sm', md: 'md' }}>{whitelist.loading}</Text>}{' '}
      {/* Font size responsive */}
      {isError && (
        <Text color="red" fontSize={{ base: 'sm', md: 'md' }}>
          {whitelist.error}
        </Text>
      )}
      {!isLoading && players.length === 0 && (
        <Text fontSize={{ base: 'sm', md: 'md' }}>{whitelist.noPlayers}</Text>
      )}
      <GlassCard as="ul" p={{ base: 2, md: 3 }} style={{ listStyle: 'none', padding: 0 }}>
        {' '}
        {/* Padding responsive */}
        {players.map((p) => (
          <HStack
            as="li"
            key={p}
            justify="space-between"
            mb={2}
            p={{ base: 2, md: 3 }} // Padding responsive
            wrap="wrap" // Wrap per mobile
          >
            <Text fontSize={{ base: 'sm', md: 'md' }}>{p}</Text> {/* Font size responsive */}
            <GlassButton
              size={{ base: 'xs', md: 'sm' }} // Size responsive
              colorScheme="red"
              onClick={() => mutate.mutate({ action: 'remove', player: p })}
              minH="32px" // Touch target minimo
            >
              {whitelist.removeUser}
            </GlassButton>
          </HStack>
        ))}
      </GlassCard>
    </Box>
  )
}
