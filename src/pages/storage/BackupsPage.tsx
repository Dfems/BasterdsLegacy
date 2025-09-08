import { useMemo, type JSX } from 'react'

import { Box, Heading, HStack, Table, Text, VStack } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { BackupScheduler } from '@/features/backup-schedule'
import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import useLanguage from '@/shared/hooks/useLanguage'

type Backup = { id: string; size: number; createdAt: number }

export default function BackupsPage(): JSX.Element {
  const { backups } = useLanguage()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery<Backup[]>({
    queryKey: ['backups'],
    queryFn: async () => {
      const r = await fetch('/api/backups')
      if (!r.ok) throw new Error('Failed to load')
      return (await r.json()) as Backup[]
    },
    staleTime: 5_000,
  })

  const create = useMutation({
    mutationFn: async (mode: 'full' | 'world') => {
      const r = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      if (!r.ok) throw new Error('Create failed')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backups'] }),
  })

  const restore = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/backups/${encodeURIComponent(id)}/restore`, {
        method: 'POST',
      })
      if (!r.ok) throw new Error('Restore failed')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backups'] }),
  })

  const rows = useMemo(() => data ?? [], [data])

  return (
    <Box p={{ base: 4, md: 6 }}>
      {' '}
      {/* Padding responsive */}
      <Heading mb={4} fontSize={{ base: 'md', md: 'lg' }}>
        {backups.title}
      </Heading>{' '}
      {/* Font size responsive */}
      <VStack gap={6} align="stretch">
        {/* Backup Scheduling Section */}
        <BackupScheduler />

        {/* Manual Backup Creation */}
        <GlassCard p={{ base: 3, md: 4 }}>
          {' '}
          {/* Padding responsive */}
          <Heading size={{ base: 'sm', md: 'md' }} mb={3}>
            Backup Manuali
          </Heading>
          <HStack gap={3} wrap="wrap" justify={{ base: 'center', sm: 'flex-start' }}>
            {' '}
            {/* Centrato su mobile */}
            <GlassButton
              onClick={() => create.mutate('full')}
              size={{ base: 'sm', md: 'md' }} // Size responsive
              minH="44px" // Touch target
            >
              Crea backup completo
            </GlassButton>
            <GlassButton
              onClick={() => create.mutate('world')}
              size={{ base: 'sm', md: 'md' }} // Size responsive
              minH="44px" // Touch target
            >
              Crea backup del mondo
            </GlassButton>
          </HStack>
        </GlassCard>

        {/* Backup List */}
        <Box>
          {!isLoading && rows.length === 0 && (
            <Text fontSize={{ base: 'sm', md: 'md' }}>{backups.noBackups}</Text>
          )}{' '}
          {/* Font size responsive */}
          {/* Mobile: Card layout */}
          <Box display={{ base: 'block', md: 'none' }}>
            {rows.map((b) => (
              <GlassCard key={b.id} mb={3} p={3}>
                <HStack justify="space-between" align="start" wrap="wrap">
                  <Box flex="1" minW="0">
                    <Text fontWeight="bold" fontSize="sm" mb={1} truncate>
                      📦 {b.id}
                    </Text>
                    <Text fontSize="xs" color="textMuted" mb={1}>
                      {(b.size / (1024 * 1024)).toFixed(1)} MB
                    </Text>
                    <Text fontSize="xs" color="textMuted">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </Text>
                  </Box>
                  <GlassButton size="xs" minH="32px" onClick={() => restore.mutate(b.id)}>
                    {backups.restore}
                  </GlassButton>
                </HStack>
              </GlassCard>
            ))}
          </Box>
          {/* Desktop: Table layout */}
          {rows.length > 0 && (
            <GlassCard inset display={{ base: 'none', md: 'block' }}>
              <Table.Root data-variant="glass">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader color="brand.primary">ID</Table.ColumnHeader>
                    <Table.ColumnHeader color="brand.primary">Creato</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end" color="brand.primary">
                      Dimensione
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color="brand.primary">Azioni</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {rows.map((b) => (
                    <Table.Row key={b.id}>
                      <Table.Cell>{b.id}</Table.Cell>
                      <Table.Cell>{new Date(b.createdAt).toLocaleString()}</Table.Cell>
                      <Table.Cell textAlign="end">
                        {(b.size / (1024 * 1024)).toFixed(1)} MB
                      </Table.Cell>
                      <Table.Cell bg="transparent" boxShadow="none">
                        <GlassButton size="xs" onClick={() => restore.mutate(b.id)}>
                          {backups.restore}
                        </GlassButton>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </GlassCard>
          )}
        </Box>
      </VStack>
    </Box>
  )
}
