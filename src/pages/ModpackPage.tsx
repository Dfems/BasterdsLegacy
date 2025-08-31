import { useState, type JSX } from 'react'

import { Box, Button, Heading, HStack, Input, Text, Textarea } from '@chakra-ui/react'

export default function ModpackPage(): JSX.Element {
  const [loader, setLoader] = useState<'Fabric' | 'Forge' | 'Quilt' | 'NeoForge'>('Fabric')
  const [mcVersion, setMcVersion] = useState('1.21.1')
  const [notes, setNotes] = useState<string>('')
  const [busy, setBusy] = useState(false)

  const runInstall = async () => {
    setBusy(true)
    setNotes('')
    try {
      const r = await fetch('/api/modpack/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loader, mcVersion }),
      })
      const data = (await r.json()) as { ok?: boolean; notes?: string[]; error?: string }
      if (!r.ok) throw new Error(data.error || 'Install failed')
      setNotes((data.notes ?? []).join('\n'))
    } catch (e) {
      setNotes(`Errore: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box p={6}>
      <Heading mb={4}>Modpack</Heading>
      <HStack mb={4} gap={3} wrap="wrap">
        <select
          value={loader}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setLoader(e.target.value as 'Fabric' | 'Forge' | 'Quilt' | 'NeoForge')
          }
          style={{ padding: '8px', borderRadius: 6 }}
        >
          <option value="Fabric">Fabric</option>
          <option value="Forge">Forge</option>
          <option value="Quilt">Quilt</option>
          <option value="NeoForge">NeoForge</option>
        </select>
        <Input value={mcVersion} onChange={(e) => setMcVersion(e.target.value)} width="auto" />
        <Button onClick={runInstall} disabled={busy}>
          {busy ? 'Installazione…' : 'Installa'}
        </Button>
      </HStack>
      <Text mb={2}>Note</Text>
      <Textarea value={notes} readOnly rows={12} width="100%" />
    </Box>
  )
}
