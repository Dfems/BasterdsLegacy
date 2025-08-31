import { useEffect, useState, type JSX } from 'react'

import { Box, Heading, HStack, Kbd, Text } from '@chakra-ui/react'

type Settings = {
  javaBin: string
  mcDir: string
  backupDir: string
  rcon: { enabled: boolean; host: string; port: number }
  backupCron: string
  retentionDays: number
  retentionWeeks: number
}

export default function SettingsPage(): JSX.Element {
  const [s, setS] = useState<Settings | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const r = await fetch('/api/settings')
        if (!r.ok) throw new Error('Failed to load settings')
        setS((await r.json()) as Settings)
      } catch (e) {
        setErr((e as Error).message)
      }
    }
    void run()
  }, [])

  return (
    <Box p={6}>
      <Heading mb={4}>Settings</Heading>
      {err && <Text color="red">{err}</Text>}
      {!s && !err && <Text>Caricamento…</Text>}
      {s && (
        <Box as="dl" display="grid" gap={2} gridTemplateColumns="max-content 1fr" mb={6}>
          <Text as="dt" color="gray.500">
            JAVA_BIN
          </Text>
          <Text as="dd">{s.javaBin}</Text>

          <Text as="dt" color="gray.500">
            MC_DIR
          </Text>
          <Text as="dd">{s.mcDir}</Text>

          <Text as="dt" color="gray.500">
            BACKUP_DIR
          </Text>
          <Text as="dd">{s.backupDir}</Text>

          <Text as="dt" color="gray.500">
            RCON
          </Text>
          <Text as="dd">{s.rcon.enabled ? `${s.rcon.host}:${s.rcon.port}` : 'disabled'}</Text>

          <Text as="dt" color="gray.500">
            BACKUP_CRON
          </Text>
          <Text as="dd">{s.backupCron}</Text>

          <Text as="dt" color="gray.500">
            RETENTION
          </Text>
          <Text as="dd">
            {s.retentionDays} days, {s.retentionWeeks} weeks
          </Text>
        </Box>
      )}

      <Heading size="md" mb={2} mt={8}>
        SFTP OS‑level
      </Heading>
      <Text mb={2}>Usa OpenSSH di sistema con utente dedicato, come descritto nel README.</Text>
      <HStack gap={2}>
        <Kbd>ssh</Kbd>
        <Text>user@server</Text>
      </HStack>
    </Box>
  )
}
