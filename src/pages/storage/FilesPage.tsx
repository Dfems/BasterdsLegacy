import { useCallback, useMemo, useRef, useState, type ChangeEvent, type JSX } from 'react'

import {
  Badge,
  Box,
  Grid,
  Heading,
  HStack,
  Input,
  Table,
  Text,
  VStack,
  Textarea,
} from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import { ModernHeader } from '@/shared/components/ModernHeader'
import { QuickActionCard } from '@/shared/components/QuickActionCard'
import { StatsCard } from '@/shared/components/StatsCard'
import { StatusIndicator } from '@/shared/components/StatusIndicator'
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

  // Edit file states
  const [editingFile, setEditingFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [originalContent, setOriginalContent] = useState<string>('')
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)

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

  const readFile = useMutation({
    mutationFn: async (filePath: string) => {
      const r = await fetch(`/api/files/content?path=${encodeURIComponent(filePath)}`)
      if (!r.ok) throw new Error('Failed to read file')
      const data = (await r.json()) as { content: string }
      return data.content
    },
    onSuccess: (content, filePath) => {
      setFileContent(content)
      setOriginalContent(content)
      setEditingFile(filePath)
      setIsEditModalOpen(true)
    },
  })

  const saveFile = useMutation({
    mutationFn: async ({ filePath, content }: { filePath: string; content: string }) => {
      const r = await fetch('/api/files/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content }),
      })
      if (!r.ok) throw new Error('Failed to save file')
    },
    onSuccess: () => {
      setOriginalContent(fileContent)
      setIsEditModalOpen(false)
      setEditingFile(null)
      qc.invalidateQueries({ queryKey: ['files'] })
    },
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

  const handleEditFile = useCallback(
    (entry: Entry) => {
      const filePath = joinPath(path, entry.name)
      readFile.mutate(filePath)
    },
    [path, readFile]
  )

  const handleSaveFile = useCallback(() => {
    if (!editingFile) return

    // Check if content has changed
    if (fileContent === originalContent) {
      // No changes, just close modal
      setIsEditModalOpen(false)
      setEditingFile(null)
      return
    }

    saveFile.mutate({ filePath: editingFile, content: fileContent })
  }, [editingFile, fileContent, originalContent, saveFile])

  const handleCancelEdit = useCallback(() => {
    const hasChanges = fileContent !== originalContent

    if (hasChanges) {
      if (!confirm(files.unsavedChanges)) {
        return // User wants to keep editing
      }
    }

    // Reset state and close modal
    setIsEditModalOpen(false)
    setEditingFile(null)
    setFileContent('')
    setOriginalContent('')
  }, [fileContent, originalContent, files])

  const rows = useMemo(() => data?.entries ?? [], [data])

  // Calculate stats for the modern header
  const totalFiles = rows.filter((entry) => entry.type === 'file').length
  const totalFolders = rows.filter((entry) => entry.type === 'dir').length
  const totalSize = rows
    .filter((entry) => entry.type === 'file')
    .reduce((sum, entry) => sum + entry.size, 0)

  return (
    <Box>
      <ModernHeader
        title={`📁 ${files.headerTitle ?? files.title}`}
        description={files.headerDescription ?? ''}
        emoji="🗂️"
      />

      <Box p={{ base: 4, md: 6 }}>
        <VStack gap={6} align="stretch">
          {/* Stats Cards Section */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
            <StatsCard
              inset
              title={files.systemFiles}
              value={totalFiles}
              icon="📄"
              badge={
                totalFiles > 100
                  ? { text: files.many, color: 'orange' }
                  : { text: files.manageable, color: 'green' }
              }
              size="sm"
            />
            <StatsCard
              inset
              title={files.directories}
              value={totalFolders}
              icon="📁"
              badge={{ text: files.organized, color: 'blue' }}
              size="sm"
            />
            <StatsCard
              inset
              title={files.storage}
              value={human(totalSize)}
              icon="💾"
              badge={
                totalSize > 100 * 1024 * 1024
                  ? { text: files.high, color: 'orange' }
                  : { text: files.ok, color: 'green' }
              }
              size="sm"
            />
          </Grid>

          {/* Navigation and Actions Section */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
            <QuickActionCard
              inset
              title={files.navigationTitle}
              description={files.navigationDescription.replace('{path}', path)}
              icon="🧭"
              gradient="linear(to-r, blue.400, cyan.500)"
              size="sm"
            >
              <VStack gap={3} w="full">
                <HStack gap={2} w="full">
                  <GlassButton
                    onClick={() => goTo(parentPath(path))}
                    disabled={path === '/'}
                    size="sm"
                    colorScheme="blue"
                    flex="0 0 auto"
                  >
                    ⬆️ {files.up}
                  </GlassButton>
                  <Input
                    value={path}
                    onChange={(e) => setPath(e.target.value || '/')}
                    data-variant="glass"
                    minH="40px"
                    fontSize="sm"
                    flex="1"
                  />
                </HStack>
                <GlassButton
                  onClick={() => qc.invalidateQueries({ queryKey: ['files'] })}
                  size="sm"
                  colorScheme="green"
                  w="full"
                >
                  🔄 {files.refresh}
                </GlassButton>
              </VStack>
            </QuickActionCard>
            <QuickActionCard
              inset
              title={files.uploadTitle}
              description={files.uploadDescription}
              icon="📤"
              gradient="linear(to-r, green.400, teal.500)"
              size="sm"
            >
              <Input
                type="file"
                ref={fileInputRef}
                onChange={onUploadChange}
                data-variant="glass"
                minH="44px"
                fontSize="sm"
                w="full"
              />
            </QuickActionCard>
          </Grid>

          {/* Error/Loading States */}
          {isLoading && (
            <GlassCard inset p={6} textAlign="center">
              <VStack gap={3}>
                <Text fontSize="lg" color="textMuted">
                  🔄 {files.loadingDir ?? files.loading}
                </Text>
                <StatusIndicator status="loading" label={files.loadingDir ?? files.loading} />
              </VStack>
            </GlassCard>
          )}

          {isError && (
            <GlassCard inset p={6} textAlign="center" borderColor="red.200">
              <VStack gap={3}>
                <Text fontSize="lg" color="red.500">
                  ⚠️ {files.loadError}
                </Text>
                <StatusIndicator status="error" label={files.connectionError ?? files.loadError} />
              </VStack>
            </GlassCard>
          )}

          {/* Empty Directory State */}
          {!isLoading && !isError && rows.length === 0 && (
            <GlassCard inset p={6} textAlign="center">
              <VStack gap={3}>
                <Text fontSize="lg" color="textMuted" mb={2}>
                  📂 {files.noItems}
                </Text>
                <Text fontSize="sm" color="textMuted">
                  {files.emptyHint}
                </Text>
                <StatusIndicator status="offline" label={files.emptyLabel} />
              </VStack>
            </GlassCard>
          )}

          {/* Files and Folders List */}
          {!isLoading && !isError && rows.length > 0 && (
            <VStack gap={4} align="stretch">
              <Heading size="md" color="brand.primary">
                📂 {files.contentsTitle} ({rows.length})
              </Heading>

              {/* Mobile: Card layout */}
              <Box display={{ base: 'block', md: 'none' }}>
                {rows.map((entry) => (
                  <GlassCard inset key={entry.name} mb={3} p={4}>
                    <VStack align="stretch" gap={3}>
                      <HStack justify="space-between" align="center">
                        <Badge
                          colorScheme={entry.type === 'dir' ? 'blue' : 'green'}
                          variant="subtle"
                        >
                          {entry.type === 'dir' ? files.tagDirectory : files.tagFile}
                        </Badge>
                        <StatusIndicator
                          status="online"
                          label={entry.type === 'dir' ? files.accessible : files.readable}
                          size="sm"
                        />
                      </HStack>
                      <Box>
                        <Text color="textMuted" fontSize="sm">
                          {files.name}
                        </Text>
                        <Text fontSize="lg" fontWeight="bold" color="brand.primary" mb={2}>
                          {entry.type === 'dir' ? '📁' : '📄'} {entry.name}
                        </Text>
                        <Grid templateColumns="1fr 1fr" gap={2} fontSize="sm">
                          <Box>
                            <Text color="textMuted">{files.size}</Text>
                            <Text fontWeight="medium">
                              {entry.type === 'file' ? human(entry.size) : files.folder}
                            </Text>
                          </Box>
                          <Box>
                            <Text color="textMuted">{files.modified}</Text>
                            <Text fontWeight="medium">
                              {new Date(entry.mtime).toLocaleDateString()}
                            </Text>
                          </Box>
                        </Grid>
                      </Box>
                      <HStack gap={2}>
                        {entry.type === 'dir' && (
                          <GlassButton
                            onClick={() => goTo(joinPath(path, entry.name))}
                            colorScheme="blue"
                            size="sm"
                            flex="1"
                          >
                            📂 {files.open}
                          </GlassButton>
                        )}
                        {/* {entry.type === 'file' && (
                          <GlassButton
                            as={ChakraLink}
                            href={`/api/files/download?path=${encodeURIComponent(joinPath(path, entry.name))}`}
                            download
                            colorScheme="green"
                            size="sm"
                            flex="1"
                          >
                            ⬇️
                          </GlassButton>
                        )} */}
                        <GlassButton
                          onClick={() => {
                            const from = joinPath(path, entry.name)
                            const nn = prompt(files.newName, entry.name)
                            if (!nn || nn === entry.name) return
                            const to = joinPath(path, nn)
                            rename.mutate({ from, to })
                          }}
                          colorScheme="orange"
                          size="sm"
                          flex="1"
                        >
                          ✏️
                        </GlassButton>
                        <GlassButton
                          colorScheme="red"
                          onClick={() => {
                            const p = joinPath(path, entry.name)
                            if (confirm(files.confirmDelete.replace('{path}', p))) remove.mutate(p)
                          }}
                          size="sm"
                          flex="1"
                        >
                          🗑️
                        </GlassButton>
                      </HStack>
                    </VStack>
                  </GlassCard>
                ))}
              </Box>

              {/* Desktop: Enhanced Table layout */}
              <GlassCard inset display={{ base: 'none', md: 'block' }}>
                <Table.Root data-variant="glass">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader color="brand.primary">
                        <HStack>
                          <Text>📂</Text>
                          <Text>{files.name}</Text>
                        </HStack>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader color="brand.primary">
                        <HStack>
                          <Text>🏷️</Text>
                          <Text>{files.type}</Text>
                        </HStack>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end" color="brand.primary">
                        <HStack justify="end">
                          <Text>💾</Text>
                          <Text>{files.size}</Text>
                        </HStack>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader color="brand.primary">
                        <HStack>
                          <Text>📅</Text>
                          <Text>{files.modified}</Text>
                        </HStack>
                      </Table.ColumnHeader>
                      {/* <Table.ColumnHeader color="brand.primary">
                        <HStack>
                          <Text>⚡</Text>
                          <Text>{common.status}</Text>
                        </HStack>
                      </Table.ColumnHeader> */}
                      <Table.ColumnHeader color="brand.primary">
                        <HStack>
                          <Text>🔧</Text>
                          <Text>{files.actions}</Text>
                        </HStack>
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {rows.map((entry) => (
                      <Table.Row key={entry.name}>
                        <Table.Cell bg="transparent" boxShadow="none">
                          <HStack>
                            {entry.type === 'dir' ? (
                              <GlassButton
                                size="sm"
                                onClick={() => goTo(joinPath(path, entry.name))}
                                colorScheme="blue"
                              >
                                📁 {entry.name}
                              </GlassButton>
                            ) : (
                              <>
                                {/* <Badge colorScheme="green" variant="outline">
                                  {files.tagFile ?? 'FILE'}
                                </Badge> */}
                                {/* <Text fontWeight="medium">📄 {entry.name}</Text> */}
                                <Text fontWeight="medium">{entry.name}</Text>
                              </>
                            )}
                          </HStack>
                        </Table.Cell>
                        <Table.Cell bg="transparent" boxShadow="none">
                          <Badge
                            colorScheme={entry.type === 'dir' ? 'blue' : 'green'}
                            variant="subtle"
                          >
                            {entry.type === 'dir'
                              ? (files.tagDirectory ?? 'DIRECTORY')
                              : (files.tagFile ?? 'FILE')}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell bg="transparent" boxShadow="none" textAlign="end">
                          <Badge colorScheme="purple" variant="plain" color={'text'}>
                            {entry.type === 'file' ? human(entry.size) : '-'}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell bg="transparent" boxShadow="none">
                          {new Date(entry.mtime).toLocaleString()}
                        </Table.Cell>
                        {/* <Table.Cell bg="transparent" boxShadow="none">
                          <StatusIndicator
                            status="online"
                            label={
                              entry.type === 'dir'
                                ? (files.accessible ?? 'Accessibile')
                                : (files.readable ?? 'Leggibile')
                            }
                            size="sm"
                          />
                        </Table.Cell> */}
                        <Table.Cell bg="transparent" boxShadow="none">
                          <HStack gap={1} alignContent={'center'} justifyContent={'center'}>
                            {/* {entry.type === 'file' && (
                              <GlassButton
                                as={ChakraLink}
                                href={`/api/files/download?path=${encodeURIComponent(joinPath(path, entry.name))}`}
                                download
                                size="xs"
                                colorScheme="green"
                              >
                                ⬇️
                              </GlassButton>
                            )} */}
                            {entry.type === 'file' && (
                              <GlassButton
                                size="xs"
                                onClick={() => handleEditFile(entry)}
                                colorScheme="blue"
                                loading={readFile.isPending}
                              >
                                📝
                              </GlassButton>
                            )}
                            <GlassButton
                              size="xs"
                              onClick={() => {
                                const from = joinPath(path, entry.name)
                                const nn = prompt(files.newName, entry.name)
                                if (!nn || nn === entry.name) return
                                const to = joinPath(path, nn)
                                rename.mutate({ from, to })
                              }}
                              colorScheme="orange"
                            >
                              ✏️
                            </GlassButton>
                            <GlassButton
                              size="xs"
                              colorScheme="red"
                              onClick={() => {
                                const p = joinPath(path, entry.name)
                                if (confirm(files.confirmDelete.replace('{path}', p)))
                                  remove.mutate(p)
                              }}
                            >
                              🗑️
                            </GlassButton>
                          </HStack>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </GlassCard>
            </VStack>
          )}
        </VStack>
      </Box>

      {/* Edit File Modal */}
      {isEditModalOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          zIndex="modal"
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelEdit()
            }
          }}
        >
          <GlassCard
            maxW="4xl"
            maxH="90vh"
            w="90vw"
            h="80vh"
            p={6}
            display="flex"
            flexDirection="column"
          >
            <VStack gap={4} align="stretch" flex="1" overflow="hidden">
              <Heading size="lg">
                {files.editingFile.replace('{filename}', editingFile?.split('/').pop() ?? '')}
              </Heading>

              <Text fontSize="sm" color="textMuted">
                {files.fileContent}
              </Text>

              <Textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                placeholder="File content..."
                resize="none"
                flex="1"
                fontFamily="monospace"
                fontSize="sm"
                bg="bg.subtle"
                border="1px solid"
                borderColor="border.subtle"
                minH="200px"
              />

              <HStack gap={3} justifyContent="flex-end">
                <GlassButton onClick={handleCancelEdit} colorScheme="gray">
                  {files.cancelEdit}
                </GlassButton>
                <GlassButton
                  onClick={handleSaveFile}
                  colorScheme="green"
                  loading={saveFile.isPending}
                  disabled={fileContent === originalContent}
                >
                  {fileContent === originalContent ? files.noChanges : files.saveFile}
                </GlassButton>
              </HStack>
            </VStack>
          </GlassCard>
        </Box>
      )}
    </Box>
  )
}
