import { useMemo, type JSX } from 'react'

import { Box, Heading, HStack, Table } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'

type Backup = { id: string; size: number; createdAt: number }

export default function BackupsPage(): JSX.Element {
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
    <Box p={6}>
      <Heading mb={4}>Backups</Heading>

      <GlassCard mb={4}>
        <HStack gap={3} wrap="wrap">
          <GlassButton onClick={() => create.mutate('full')}>Crea backup completo</GlassButton>
          <GlassButton onClick={() => create.mutate('world')}>Crea backup del mondo</GlassButton>
        </HStack>
      </GlassCard>

      {!isLoading && rows.length === 0 && <div>Nessun backup</div>}

      {rows.length > 0 && (
        <GlassCard inset>
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
                  <Table.Cell textAlign="end">{(b.size / (1024 * 1024)).toFixed(1)} MB</Table.Cell>
                  <Table.Cell bg="transparent" boxShadow="none">
                    <GlassButton size="xs" onClick={() => restore.mutate(b.id)}>
                      Ripristina
                    </GlassButton>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </GlassCard>
      )}
    </Box>
  )
}
