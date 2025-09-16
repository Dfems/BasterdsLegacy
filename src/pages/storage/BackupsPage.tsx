import { useMemo, useState, type JSX } from 'react'

import { Badge, Box, Button, Grid, HStack, Table, Text, VStack } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { BackupScheduler } from '@/features/backup-schedule'
import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import { ModernHeader } from '@/shared/components/ModernHeader'
import { QuickActionCard } from '@/shared/components/QuickActionCard'
import { StatsCard } from '@/shared/components/StatsCard'
import { StatusIndicator } from '@/shared/components/StatusIndicator'
import useLanguage from '@/shared/hooks/useLanguage'

type Backup = { id: string; size: number; createdAt: number }

type NotificationState = {
  type: 'success' | 'error' | null
  message: string
}

export default function BackupsPage(): JSX.Element {
  const { backups, common, dashboard } = useLanguage()
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

  // Calculate stats for the modern header
  const totalBackups = rows.length
  const totalSize = rows.reduce((sum, backup) => sum + backup.size, 0)
  const totalSizeMB = totalSize / (1024 * 1024)

  return (
    <Box>
      <ModernHeader
        title={`🗄️ ${backups.headerTitle ?? backups.title}`}
        description={backups.headerDescription ?? ''}
        emoji="💾"
      />

      <Box p={{ base: 4, md: 6 }}>
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

        <VStack gap={6} align="stretch">
          {/* Stats Cards Section */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
            <StatsCard
              inset
              title={backups.availableBackups ?? 'Backup Disponibili'}
              value={totalBackups}
              icon="📦"
              badge={
                totalBackups > 0
                  ? { text: dashboard.online, color: 'green' }
                  : { text: backups.noBackups, color: 'gray' }
              }
              size="sm"
            />
            <StatsCard
              inset
              title={backups.storageUsed ?? 'Storage Utilizzato'}
              value={`${totalSizeMB.toFixed(1)} MB`}
              icon="💽"
              badge={
                totalSizeMB > 1000
                  ? { text: common.error ?? 'Alto', color: 'orange' }
                  : { text: 'OK', color: 'green' }
              }
              size="sm"
            />
            <StatsCard
              inset
              title={backups.systemStatus ?? 'Status Sistema'}
              value={isLoading ? backups.creating : dashboard.online}
              icon="⚡"
              badge={
                isLoading
                  ? { text: backups.creating ?? 'Loading', color: 'blue' }
                  : { text: dashboard.online, color: 'green' }
              }
              size="sm"
            />
          </Grid>

          {/* Quick Actions Section */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
            <QuickActionCard
              inset
              title={backups.fullBackupTitle ?? 'Backup Completo'}
              description={
                backups.fullBackupDescription ?? 'Crea un backup completo di tutto il server'
              }
              icon="🔄"
              gradient="linear(to-r, blue.400, purple.500)"
              size="sm"
            >
              <GlassButton
                onClick={() => create.mutate('full')}
                size="md"
                colorScheme="blue"
                loading={create.isPending}
                w="full"
              >
                {backups.startFullBackup ?? 'Avvia Backup Completo'}
              </GlassButton>
            </QuickActionCard>
            <QuickActionCard
              inset
              title={backups.worldBackupTitle ?? 'Backup del Mondo'}
              description={
                backups.worldBackupDescription ?? 'Crea un backup rapido solo del mondo di gioco'
              }
              icon="🌍"
              gradient="linear(to-r, green.400, teal.500)"
              size="sm"
            >
              <GlassButton
                onClick={() => create.mutate('world')}
                size="md"
                colorScheme="green"
                loading={create.isPending}
                w="full"
              >
                {backups.startWorldBackup ?? 'Backup Solo Mondo'}
              </GlassButton>
            </QuickActionCard>
          </Grid>

          {/* Backup Scheduling Section */}
          <BackupScheduler />

          {/* Backup List */}
          <Box>
            {!isLoading && rows.length === 0 && (
              <GlassCard inset p={6} textAlign="center">
                <Text fontSize="lg" color="textMuted" mb={2}>
                  📦 {backups.noBackups}
                </Text>
                <Text fontSize="sm" color="textMuted">
                  {backups.emptyHint ??
                    'Crea il tuo primo backup per iniziare a proteggere i tuoi dati!'}
                </Text>
              </GlassCard>
            )}

            {/* Mobile: Card layout */}
            <Box display={{ base: 'block', md: 'none' }}>
              {rows.map((b) => (
                <GlassCard inset key={b.id} mb={3} p={4}>
                  <VStack align="stretch" gap={3}>
                    <HStack justify="space-between" align="start">
                      <Box flex="1" minW="0">
                        <HStack align="center" mb={2}>
                          <Text fontSize="md" fontWeight="bold" color="brand.primary">
                            📦 {b.id}
                          </Text>
                          <StatusIndicator
                            status="online"
                            label={backups.ready ?? 'Pronto'}
                            size="sm"
                          />
                        </HStack>
                        <Grid templateColumns="1fr 1fr" gap={2} fontSize="sm">
                          <Box>
                            <Text color="textMuted">{common.size}</Text>
                            <Text fontWeight="medium">
                              {(b.size / (1024 * 1024)).toFixed(1)} MB
                            </Text>
                          </Box>
                          <Box>
                            <Text color="textMuted">{common.created}</Text>
                            <Text fontWeight="medium">
                              {new Date(b.createdAt).toLocaleDateString()}
                            </Text>
                          </Box>
                        </Grid>
                      </Box>
                    </HStack>
                    <GlassButton
                      onClick={() => restore.mutate(b.id)}
                      loading={restore.isPending}
                      colorScheme="orange"
                      size="sm"
                      w="full"
                    >
                      🔄 {backups.restore}
                    </GlassButton>
                  </VStack>
                </GlassCard>
              ))}
            </Box>

            {/* Desktop: Enhanced Table layout */}
            {rows.length > 0 && (
              <GlassCard inset display={{ base: 'none', md: 'block' }}>
                <Table.Root data-variant="glass">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader color="brand.primary">
                        <HStack>
                          <Text>📦</Text>
                          <Text>{common.id}</Text>
                        </HStack>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader color="brand.primary">
                        <HStack>
                          <Text>📅</Text>
                          <Text>{common.created}</Text>
                        </HStack>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end" color="brand.primary">
                        <HStack justify="end">
                          <Text>💽</Text>
                          <Text>{common.size}</Text>
                        </HStack>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader color="brand.primary">
                        <HStack>
                          <Text>⚡</Text>
                          <Text>{common.status}</Text>
                        </HStack>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader color="brand.primary">
                        <HStack>
                          <Text>🔧</Text>
                          <Text>{common.actions}</Text>
                        </HStack>
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {rows.map((b) => (
                      <Table.Row key={b.id}>
                        <Table.Cell>
                          <HStack>
                            <Badge colorScheme="blue" variant="subtle">
                              BACKUP
                            </Badge>
                            <Text fontWeight="medium">{b.id}</Text>
                          </HStack>
                        </Table.Cell>
                        <Table.Cell>{new Date(b.createdAt).toLocaleString()}</Table.Cell>
                        <Table.Cell textAlign="end">
                          <Badge colorScheme="green" variant="outline">
                            {(b.size / (1024 * 1024)).toFixed(1)} MB
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <StatusIndicator status="online" label={backups.ready ?? 'Pronto'} />
                        </Table.Cell>
                        <Table.Cell bg="transparent" boxShadow="none">
                          <GlassButton
                            size="sm"
                            onClick={() => restore.mutate(b.id)}
                            loading={restore.isPending}
                            colorScheme="orange"
                          >
                            🔄 {backups.restore}
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
    </Box>
  )
}
