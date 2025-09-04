import { useCallback, useMemo, useRef, useState, type ChangeEvent, type JSX } from 'react'

import { Box, Heading, HStack, Input, Table, Text } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import useLanguage from '@/shared/hooks/useLanguage'

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
  const { files } = useLanguage()
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
    <Box p={{ base: 4, md: 6 }}>
      {' '}
      {/* Padding responsive */}
      <Heading mb={4} fontSize={{ base: 'md', md: 'lg' }}>
        {files.title}
      </Heading>{' '}
      {/* Font size responsive */}
      <GlassCard mb={4} p={{ base: 3, md: 4 }}>
        {' '}
        {/* Padding responsive */}
        <HStack gap={3} wrap="wrap" justify={{ base: 'center', sm: 'flex-start' }}>
          {' '}
          {/* Centrato su mobile */}
          <GlassButton
            onClick={() => goTo(parentPath(path))}
            disabled={path === '/'}
            size={{ base: 'sm', md: 'md' }} // Size responsive
            minH="44px" // Touch target
          >
            {files.up}
          </GlassButton>
          <Input
            value={path}
            onChange={(e) => setPath(e.target.value || '/')}
            width="auto"
            data-variant="glass"
            minW={{ base: '200px', sm: 'auto' }} // Larghezza minima su mobile
            minH="44px" // Touch target
            fontSize={{ base: 'sm', md: 'md' }} // Font size responsive
          />
          <GlassButton
            onClick={() => qc.invalidateQueries({ queryKey: ['files'] })}
            size={{ base: 'sm', md: 'md' }} // Size responsive
            minH="44px" // Touch target
          >
            {files.refresh}
          </GlassButton>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={onUploadChange}
            width="auto"
            data-variant="glass"
            minW={{ base: '200px', sm: 'auto' }} // Larghezza minima su mobile
            minH="44px" // Touch target
            fontSize={{ base: 'sm', md: 'md' }} // Font size responsive
          />
        </HStack>
      </GlassCard>
      {isLoading && <Text fontSize={{ base: 'sm', md: 'md' }}>{files.loading}</Text>}
      {isError && (
        <Text color="red" fontSize={{ base: 'sm', md: 'md' }}>
          {files.loadError}
        </Text>
      )}
      {!isLoading && rows.length === 0 && (
        <Text fontSize={{ base: 'sm', md: 'md' }}>{files.noItems}</Text>
      )}
      {/* Mobile: Card layout */}
      <Box display={{ base: 'block', md: 'none' }}>
        {rows.map((e) => (
          <GlassCard key={e.name} mb={3} p={3}>
            <HStack justify="space-between" align="start" wrap="wrap">
              <Box flex="1" minW="0">
                <Text fontWeight="bold" fontSize="sm" mb={1} truncate>
                  {' '}
                  {/* truncate invece di noOfLines */}
                  {e.type === 'dir' ? (
                    <GlassButton size="xs" onClick={() => goTo(joinPath(path, e.name))} minH="32px">
                      📁 {e.name}
                    </GlassButton>
                  ) : (
                    <>📄 {e.name}</>
                  )}
                </Text>
                <Text fontSize="xs" color="textMuted" mb={1}>
                  {e.type === 'file' ? human(e.size) : files.folder}
                </Text>
                <Text fontSize="xs" color="textMuted">
                  {new Date(e.mtime).toLocaleDateString()}
                </Text>
              </Box>
              <HStack gap={1} wrap="wrap">
                <GlassButton
                  size="xs"
                  minH="32px"
                  onClick={() => {
                    const from = joinPath(path, e.name)
                    const nn = prompt(files.newName, e.name)
                    if (!nn || nn === e.name) return
                    const to = joinPath(path, nn)
                    rename.mutate({ from, to })
                  }}
                >
                  {files.rename}
                </GlassButton>
                <GlassButton
                  size="xs"
                  minH="32px"
                  colorScheme="red"
                  onClick={() => {
                    const p = joinPath(path, e.name)
                    if (confirm(files.confirmDelete.replace('{path}', p))) remove.mutate(p)
                  }}
                >
                  {files.delete}
                </GlassButton>
              </HStack>
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
                <Table.ColumnHeader color="brand.primary">{files.name}</Table.ColumnHeader>
                <Table.ColumnHeader color="brand.primary">{files.type}</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end" color="brand.primary">
                  {files.size}
                </Table.ColumnHeader>
                <Table.ColumnHeader color="brand.primary">{files.modified}</Table.ColumnHeader>
                <Table.ColumnHeader color="brand.primary">{files.actions}</Table.ColumnHeader>
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
                          const nn = prompt(files.newName, e.name)
                          if (!nn || nn === e.name) return
                          const to = joinPath(path, nn)
                          rename.mutate({ from, to })
                        }}
                      >
                        {files.rename}
                      </GlassButton>
                      <GlassButton
                        size="xs"
                        colorScheme="red"
                        onClick={() => {
                          const p = joinPath(path, e.name)
                          if (confirm(files.confirmDelete.replace('{path}', p))) remove.mutate(p)
                        }}
                      >
                        {files.delete}
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
