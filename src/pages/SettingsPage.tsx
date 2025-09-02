import { useEffect, useState, type JSX } from 'react'

import { Box, Heading, HStack, Kbd, RadioGroup, Stack, Text } from '@chakra-ui/react'

import { useThemeMode, type ThemeMode } from '@/contexts/ThemeModeContext'
import { GlassCard } from '@/shared/components/GlassCard'

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
  const theme = useThemeMode()
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
        <GlassCard
          as="dl"
          display="grid"
          gap={2}
          gridTemplateColumns={{ base: '1fr', sm: 'max-content 1fr' }}
          mb={6}
        >
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
        </GlassCard>
      )}

      <GlassCard inset>
        <Heading size="md" mb={2}>
          SFTP OS‑level
        </Heading>
        <Text mb={2}>Usa OpenSSH di sistema con utente dedicato, come descritto nel README.</Text>
        <HStack gap={2}>
          <Kbd>ssh</Kbd>
          <Text>user@server</Text>
        </HStack>
      </GlassCard>

      <GlassCard inset mt={6}>
        <Heading size="md" mb={3}>
          Tema
        </Heading>
        <Text mb={2}>Scegli la modalità colore (salvata in locale e applicata subito).</Text>
        <RadioGroup.Root
          value={theme.mode}
          onValueChange={(details) => {
            const v = details.value ?? 'system'
            theme.setMode(v as ThemeMode)
          }}
        >
          <Stack direction={{ base: 'column', sm: 'row' }} gap={4}>
            <RadioGroup.Item value="system">
              <RadioGroup.ItemControl />
              <RadioGroup.ItemText>Sistema</RadioGroup.ItemText>
            </RadioGroup.Item>
            <RadioGroup.Item value="dark">
              <RadioGroup.ItemControl />
              <RadioGroup.ItemText>Dark</RadioGroup.ItemText>
            </RadioGroup.Item>
            <RadioGroup.Item value="light">
              <RadioGroup.ItemControl />
              <RadioGroup.ItemText>Light</RadioGroup.ItemText>
            </RadioGroup.Item>
          </Stack>
        </RadioGroup.Root>
        <Text mt={2} color="gray.500">
          Attuale: {theme.resolved}
        </Text>
      </GlassCard>
    </Box>
  )
}
