import { useCallback, useMemo, useRef, useState, type ChangeEvent, type JSX } from 'react'

import { Box, Heading, HStack, Input, Table, Text } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'

type Entry = {
  name: string
  type: 'file' | 'dir'
  size: number
  mtime: number
}

const joinPath = (base: string, name: string) =>
  base === '/' ? `/${name}` : `${base.replace(/\/$/, '')}/${name}`

const parentPath = (p: string) => (p === '/' ? '/' : p.replace(/\/?[^/]+\/?$/, '') || '/')

const human = (n: number) => {
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let v = n
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(1)} ${units[i]}`
}

export default function FilesPage(): JSX.Element {
  const qc = useQueryClient()
  const [path, setPath] = useState<string>('/')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading, isError, refetch } = useQuery<{ entries: Entry[] }>({
    queryKey: ['files', path],
    queryFn: async () => {
      const r = await fetch(`/api/files?path=${encodeURIComponent(path)}`)
      if (!r.ok) throw new Error('Failed to load')
      return (await r.json()) as { entries: Entry[] }
    },
    staleTime: 5_000,
  })

  const goTo = useCallback((p: string) => setPath(p || '/'), [])

  const remove = useMutation({
    mutationFn: async (p: string) => {
      const r = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: p }),
      })
      if (!r.ok) throw new Error('Delete failed')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  })

  const rename = useMutation({
    mutationFn: async ({ from, to }: { from: string; to: string }) => {
      const r = await fetch('/api/files/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to }),
      })
      if (!r.ok) throw new Error('Rename failed')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  })

  const onUploadChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (!f) return
      const form = new FormData()
      form.set('file', f)
      const to = joinPath(path, f.name)
      const r = await fetch(`/api/files/upload?to=${encodeURIComponent(to)}`, {
        method: 'POST',
        body: form,
      })
      if (!r.ok) {
        // reset selection
        if (fileInputRef.current) fileInputRef.current.value = ''
        throw new Error('Upload failed')
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
      await refetch()
    },
    [path, refetch]
  )

  const rows = useMemo(() => data?.entries ?? [], [data])

  return (
    <Box p={6}>
      <Heading mb={4}>Files</Heading>

      <GlassCard mb={4}>
        <HStack gap={3} wrap="wrap">
          <GlassButton onClick={() => goTo(parentPath(path))} disabled={path === '/'}>
            Su
          </GlassButton>
          <Input
            value={path}
            onChange={(e) => setPath(e.target.value || '/')}
            width="auto"
            data-variant="glass"
          />
          <GlassButton onClick={() => qc.invalidateQueries({ queryKey: ['files'] })}>
            Refresh
          </GlassButton>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={onUploadChange}
            width="auto"
            data-variant="glass"
          />
        </HStack>
      </GlassCard>

      {isLoading && <Text>Caricamento…</Text>}
      {isError && <Text color="red">Errore nel caricamento.</Text>}

      {!isLoading && rows.length === 0 && <Text>Nessun elemento</Text>}

      {rows.length > 0 && (
        <GlassCard inset>
          <Table.Root data-variant="glass">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader color="green.300">Nome</Table.ColumnHeader>
                <Table.ColumnHeader color="green.300">Tipo</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end" color="green.300">
                  Dimensione
                </Table.ColumnHeader>
                <Table.ColumnHeader color="green.300">Modificato</Table.ColumnHeader>
                <Table.ColumnHeader color="green.300">Azioni</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((e) => (
                <Table.Row key={e.name}>
                  <Table.Cell bg="transparent" boxShadow="none">
                    {e.type === 'dir' ? (
                      <GlassButton size="xs" onClick={() => goTo(joinPath(path, e.name))}>
                        {e.name}
                      </GlassButton>
                    ) : (
                      e.name
                    )}
                  </Table.Cell>
                  <Table.Cell bg="transparent" boxShadow="none">
                    {e.type}
                  </Table.Cell>
                  <Table.Cell bg="transparent" boxShadow="none" textAlign="end">
                    {e.type === 'file' ? human(e.size) : '-'}
                  </Table.Cell>
                  <Table.Cell bg="transparent" boxShadow="none">
                    {new Date(e.mtime).toLocaleString()}
                  </Table.Cell>
                  <Table.Cell bg="transparent" boxShadow="none">
                    <HStack gap={2}>
                      <GlassButton
                        size="xs"
                        onClick={() => {
                          const from = joinPath(path, e.name)
                          const nn = prompt('Nuovo nome', e.name)
                          if (!nn || nn === e.name) return
                          const to = joinPath(path, nn)
                          rename.mutate({ from, to })
                        }}
                      >
                        Rinomina
                      </GlassButton>
                      <GlassButton
                        size="xs"
                        colorScheme="red"
                        onClick={() => {
                          const p = joinPath(path, e.name)
                          if (confirm(`Eliminare ${p}?`)) remove.mutate(p)
                        }}
                      >
                        Elimina
                      </GlassButton>
                    </HStack>
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
