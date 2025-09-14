import { useMemo, useState, type JSX } from 'react'

import { Box, Button, Heading, HStack, Table, Text, VStack } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { BackupScheduler } from '@/features/backup-schedule'
import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import useLanguage from '@/shared/hooks/useLanguage'

type Backup = { id: string; size: number; createdAt: number }

type NotificationState = {
  type: 'success' | 'error' | null
  message: string
}

export default function BackupsPage(): JSX.Element {
  const { backups, common } = useLanguage()
  const qc = useQueryClient()
  const [notification, setNotification] = useState<NotificationState>({ type: null, message: '' })
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backups'] })
      const successMessage =
        'createSuccess' in backups && typeof backups.createSuccess === 'string'
          ? backups.createSuccess
          : 'Backup creato con successo!'
      setNotification({ type: 'success', message: successMessage })
      setTimeout(() => setNotification({ type: null, message: '' }), 3000)
    },
    onError: () => {
      const errorMessage =
        'createError' in backups && typeof backups.createError === 'string'
          ? backups.createError
          : 'Errore durante la creazione del backup'
      setNotification({ type: 'error', message: errorMessage })
      setTimeout(() => setNotification({ type: null, message: '' }), 5000)
    },
  })

  const restore = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/backups/${encodeURIComponent(id)}/restore`, {
        method: 'POST',
      })
      if (!r.ok) throw new Error('Restore failed')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backups'] })
      const successMessage =
        'restoreSuccess' in backups && typeof backups.restoreSuccess === 'string'
          ? backups.restoreSuccess
          : 'Backup ripristinato con successo!'
      setNotification({ type: 'success', message: successMessage })
      setTimeout(() => setNotification({ type: null, message: '' }), 3000)
    },
    onError: () => {
      const errorMessage =
        'restoreError' in backups && typeof backups.restoreError === 'string'
          ? backups.restoreError
          : 'Errore durante il ripristino del backup'
      setNotification({ type: 'error', message: errorMessage })
      setTimeout(() => setNotification({ type: null, message: '' }), 5000)
    },
  })

  const rows = useMemo(() => data ?? [], [data])

  return (
    <Box p={{ base: 4, md: 6 }}>
      {' '}
      {/* Padding responsive */}
      {/* Notification */}
      {notification.type && (
        <Box
          bg={notification.type === 'success' ? 'green.100' : 'red.100'}
          color={notification.type === 'success' ? 'green.800' : 'red.800'}
          p={4}
          mb={4}
          borderRadius="md"
          position="relative"
          border="1px solid"
          borderColor={notification.type === 'success' ? 'green.200' : 'red.200'}
        >
          <Text>{notification.message}</Text>
          <Button
            size="xs"
            variant="ghost"
            position="absolute"
            right={2}
            top={2}
            onClick={() => setNotification({ type: null, message: '' })}
          >
            ✕
          </Button>
        </Box>
      )}
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
                    <Table.ColumnHeader color="brand.primary">{common.id}</Table.ColumnHeader>
                    <Table.ColumnHeader color="brand.primary">{common.created}</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end" color="brand.primary">
                      {common.size}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color="brand.primary">{common.actions}</Table.ColumnHeader>
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
