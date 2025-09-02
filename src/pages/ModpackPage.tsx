import { useState, type JSX } from 'react'

import { Box, Heading, HStack, Input, Text, Textarea } from '@chakra-ui/react'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import { SimpleSelect } from '@/shared/components/SimpleSelect'

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

      <GlassCard mb={4}>
        <HStack gap={3} wrap="wrap">
          <SimpleSelect
            value={loader}
            onChange={(v) => setLoader(v as typeof loader)}
            options={[
              { value: 'Fabric', label: 'Fabric' },
              { value: 'Forge', label: 'Forge' },
              { value: 'Quilt', label: 'Quilt' },
              { value: 'NeoForge', label: 'NeoForge' },
            ]}
          />
          <Input value={mcVersion} onChange={(e) => setMcVersion(e.target.value)} width="auto" />
          <GlassButton onClick={runInstall} disabled={busy}>
            {busy ? 'Installazione…' : 'Installa'}
          </GlassButton>
        </HStack>
      </GlassCard>

      <GlassCard inset>
        <Text mb={2}>Note</Text>
        <Textarea value={notes} readOnly rows={12} width="100%" />
      </GlassCard>
    </Box>
  )
}
