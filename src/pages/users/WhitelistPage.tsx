import { useMemo, useState, type JSX } from 'react'

import { Badge, Box, Grid, Heading, HStack, Input, Text, VStack } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import { ModernHeader } from '@/shared/components/ModernHeader'
import { QuickActionCard } from '@/shared/components/QuickActionCard'
import { StatsCard } from '@/shared/components/StatsCard'
import { StatusIndicator } from '@/shared/components/StatusIndicator'
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

  // Calculate stats for the modern header
  const totalPlayers = players.length
  const whitelistStatus = !isError && !isLoading ? 'active' : 'inactive'

  return (
    <Box>
      {/* Modern Header with stunning animations and gradients */}
      <ModernHeader
        title="👥 Gestione Whitelist"
        description="Controllo accesso giocatori con sistema whitelist avanzato"
        emoji="🛡️"
      />

      <Box p={{ base: 4, md: 6 }}>
        <VStack gap={6} align="stretch">
          {/* Stats Cards Section */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
            <StatsCard
              title="Giocatori Totali"
              value={totalPlayers}
              icon="👥"
              badge={
                totalPlayers > 10
                  ? { text: 'Popolato', color: 'green' }
                  : { text: 'Piccolo', color: 'blue' }
              }
            />
            <StatsCard
              title="Sistema Whitelist"
              value={whitelistStatus === 'active' ? 'Attivo' : 'Inattivo'}
              icon="🛡️"
              badge={
                whitelistStatus === 'active'
                  ? { text: 'Sicuro', color: 'green' }
                  : { text: 'Offline', color: 'red' }
              }
            />
            <StatsCard
              title="Status Server"
              value={isLoading ? 'Caricamento...' : 'Operativo'}
              icon="⚡"
              badge={
                isLoading ? { text: 'Loading', color: 'blue' } : { text: 'Online', color: 'green' }
              }
            />
          </Grid>

          {/* Quick Actions Section */}
          <QuickActionCard
            title="Aggiungi Nuovo Giocatore"
            description="Inserisci l'username Minecraft per autorizzare l'accesso al server"
            icon="➕"
            gradient="linear(to-r, green.400, teal.500)"
          >
            <HStack gap={3} w="full">
              <Input
                placeholder={whitelist.usernamePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-variant="glass"
                minH="44px"
                fontSize={{ base: 'sm', md: 'md' }}
                flex="1"
              />
              <GlassButton
                onClick={() => {
                  if (name.trim()) {
                    mutate.mutate({ action: 'add', player: name.trim() })
                    setName('')
                  }
                }}
                disabled={!name.trim()}
                size="md"
                colorScheme="green"
                loading={mutate.isPending}
                minH="44px"
              >
                ➕ {whitelist.addUser}
              </GlassButton>
            </HStack>
          </QuickActionCard>

          {/* Error/Loading States */}
          {isLoading && (
            <GlassCard p={6} textAlign="center">
              <VStack gap={3}>
                <Text fontSize="lg" color="textMuted">
                  🔄 {whitelist.loading}
                </Text>
                <StatusIndicator status="loading" label="Caricamento dati..." />
              </VStack>
            </GlassCard>
          )}

          {isError && (
            <GlassCard p={6} textAlign="center" borderColor="red.200">
              <VStack gap={3}>
                <Text fontSize="lg" color="red.500">
                  ⚠️ {whitelist.error}
                </Text>
                <StatusIndicator status="error" label="Errore di connessione" />
              </VStack>
            </GlassCard>
          )}

          {/* Empty State */}
          {!isLoading && !isError && players.length === 0 && (
            <GlassCard p={6} textAlign="center">
              <VStack gap={3}>
                <Text fontSize="lg" color="textMuted" mb={2}>
                  👤 {whitelist.noPlayers}
                </Text>
                <Text fontSize="sm" color="textMuted">
                  Aggiungi il primo giocatore per iniziare a gestire l'accesso al server!
                </Text>
                <StatusIndicator status="offline" label="Lista vuota" />
              </VStack>
            </GlassCard>
          )}

          {/* Players List */}
          {!isLoading && !isError && players.length > 0 && (
            <VStack gap={4} align="stretch">
              <Heading size="md" color="brand.primary">
                🎮 Giocatori Autorizzati ({players.length})
              </Heading>

              {/* Mobile: Card layout */}
              <Box display={{ base: 'block', md: 'none' }}>
                {players.map((player) => (
                  <GlassCard key={player} mb={3} p={4}>
                    <VStack align="stretch" gap={3}>
                      <HStack justify="space-between" align="center">
                        <HStack>
                          <Badge colorScheme="green" variant="subtle">
                            AUTORIZZATO
                          </Badge>
                          <StatusIndicator status="online" label="Whitelist" size="sm" />
                        </HStack>
                      </HStack>
                      <Box>
                        <Text color="textMuted" fontSize="sm">
                          Username Minecraft
                        </Text>
                        <Text fontSize="lg" fontWeight="bold" color="brand.primary">
                          🎮 {player}
                        </Text>
                      </Box>
                      <GlassButton
                        colorScheme="red"
                        onClick={() => mutate.mutate({ action: 'remove', player })}
                        loading={mutate.isPending}
                        size="sm"
                        w="full"
                      >
                        🗑️ {whitelist.removeUser}
                      </GlassButton>
                    </VStack>
                  </GlassCard>
                ))}
              </Box>

              {/* Desktop: Enhanced Grid layout */}
              <Grid
                templateColumns={{ base: '1fr', md: 'repeat(auto-fill, minmax(300px, 1fr))' }}
                gap={4}
                display={{ base: 'none', md: 'grid' }}
              >
                {players.map((player) => (
                  <GlassCard key={player} p={4}>
                    <VStack align="stretch" gap={3}>
                      <HStack justify="space-between" align="center">
                        <Badge colorScheme="green" variant="subtle">
                          AUTORIZZATO
                        </Badge>
                        <StatusIndicator status="online" label="Attivo" size="sm" />
                      </HStack>
                      <Box textAlign="center">
                        <Text color="textMuted" fontSize="sm" mb={1}>
                          Username Minecraft
                        </Text>
                        <Text fontSize="xl" fontWeight="bold" color="brand.primary">
                          🎮 {player}
                        </Text>
                      </Box>
                      <GlassButton
                        colorScheme="red"
                        onClick={() => mutate.mutate({ action: 'remove', player })}
                        loading={mutate.isPending}
                        size="sm"
                        w="full"
                      >
                        🗑️ {whitelist.removeUser}
                      </GlassButton>
                    </VStack>
                  </GlassCard>
                ))}
              </Grid>
            </VStack>
          )}
        </VStack>
      </Box>
    </Box>
  )
}
