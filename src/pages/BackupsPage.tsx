import { useMemo, type JSX } from 'react'

import { Box, Button, Heading, HStack, Table } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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

      <HStack mb={4} gap={3} wrap="wrap">
        <Button onClick={() => create.mutate('full')}>Crea backup completo</Button>
        <Button onClick={() => create.mutate('world')}>Crea backup del mondo</Button>
      </HStack>

      {!isLoading && rows.length === 0 && <div>Nessun backup</div>}

      {rows.length > 0 && (
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>ID</Table.ColumnHeader>
              <Table.ColumnHeader>Creato</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Dimensione</Table.ColumnHeader>
              <Table.ColumnHeader>Azioni</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((b) => (
              <Table.Row key={b.id}>
                <Table.Cell>{b.id}</Table.Cell>
                <Table.Cell>{new Date(b.createdAt).toLocaleString()}</Table.Cell>
                <Table.Cell textAlign="end">{(b.size / (1024 * 1024)).toFixed(1)} MB</Table.Cell>
                <Table.Cell>
                  <Button size="xs" onClick={() => restore.mutate(b.id)}>
                    Ripristina
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  )
}
