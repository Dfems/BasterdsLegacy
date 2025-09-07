import { useEffect, useState, type JSX } from 'react'

import { Box, Heading, HStack, Kbd, RadioGroup, Stack, Text } from '@chakra-ui/react'

import { useThemeMode, type ThemeMode } from '@/entities/user/ThemeModeContext'
import { GlassCard } from '@/shared/components/GlassCard'
import useLanguage from '@/shared/hooks/useLanguage'

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
  const { settings } = useLanguage()
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
    <Box p={{ base: 4, md: 6 }}>
      {' '}
      {/* Padding responsive */}
      <Heading mb={4} fontSize={{ base: 'md', md: 'lg' }}>
        {settings.title}
      </Heading>{' '}
      {/* Font size responsive */}
      {err && (
        <Text color="accent.danger" fontSize={{ base: 'sm', md: 'md' }}>
          {settings.errorLoad}: {err}
        </Text>
      )}
      {!s && !err && <Text fontSize={{ base: 'sm', md: 'md' }}>{settings.loading}</Text>}
      {s && (
        <GlassCard
          as="dl"
          display="grid"
          gap={3} // Aumentato gap per mobile
          gridTemplateColumns={{ base: '1fr', sm: 'max-content 1fr' }}
          mb={6}
          p={{ base: 3, md: 4 }} // Padding responsive
        >
          <Text as="dt" color="textMuted" fontSize={{ base: 'sm', md: 'md' }}>
            {' '}
            {/* Font size responsive */}
            JAVA_BIN
          </Text>
          <Text as="dd" fontSize={{ base: 'sm', md: 'md' }} wordBreak="break-all">
            {' '}
            {/* Responsive e word break per mobile */}
            {s.javaBin}
          </Text>

          <Text as="dt" color="textMuted" fontSize={{ base: 'sm', md: 'md' }}>
            MC_DIR
          </Text>
          <Text as="dd" fontSize={{ base: 'sm', md: 'md' }} wordBreak="break-all">
            {s.mcDir}
          </Text>

          <Text as="dt" color="textMuted" fontSize={{ base: 'sm', md: 'md' }}>
            BACKUP_DIR
          </Text>
          <Text as="dd" fontSize={{ base: 'sm', md: 'md' }} wordBreak="break-all">
            {s.backupDir}
          </Text>

          <Text as="dt" color="textMuted" fontSize={{ base: 'sm', md: 'md' }}>
            RCON
          </Text>
          <Text as="dd" fontSize={{ base: 'sm', md: 'md' }}>
            {s.rcon.enabled ? `${s.rcon.host}:${s.rcon.port}` : 'disabled'}
          </Text>

          <Text as="dt" color="textMuted" fontSize={{ base: 'sm', md: 'md' }}>
            BACKUP_CRON
          </Text>
          <Text as="dd" fontSize={{ base: 'sm', md: 'md' }}>
            {s.backupCron}
          </Text>

          <Text as="dt" color="textMuted" fontSize={{ base: 'sm', md: 'md' }}>
            RETENTION
          </Text>
          <Text as="dd" fontSize={{ base: 'sm', md: 'md' }}>
            {s.retentionDays} days, {s.retentionWeeks} weeks
          </Text>
        </GlassCard>
      )}
      <GlassCard inset p={{ base: 3, md: 4 }}>
        {' '}
        {/* Padding responsive */}
        <Heading size={{ base: 'sm', md: 'md' }} mb={2}>
          {' '}
          {/* Font size responsive */}
          {settings.sftp.title}
        </Heading>
        <Text mb={2} fontSize={{ base: 'sm', md: 'md' }}>
          {settings.sftp.description}
        </Text>
        <HStack gap={2} wrap="wrap">
          {' '}
          {/* Wrap per mobile */}
          <Kbd fontSize={{ base: 'xs', md: 'sm' }}>{settings.sftp.ssh}</Kbd>{' '}
          {/* Font size responsive */}
          <Text fontSize={{ base: 'sm', md: 'md' }}>{settings.sftp.user}</Text>
        </HStack>
      </GlassCard>
      <GlassCard inset mt={6} p={{ base: 3, md: 4 }}>
        {' '}
        {/* Padding responsive */}
        <Heading size={{ base: 'sm', md: 'md' }} mb={3}>
          {' '}
          {/* Font size responsive */}
          {settings.theme.title}
        </Heading>
        <Text mb={2} fontSize={{ base: 'sm', md: 'md' }}>
          {settings.theme.description}
        </Text>
        <RadioGroup.Root
          value={theme.mode}
          onValueChange={(details) => {
            const v = details.value ?? 'system'
            theme.setMode(v as ThemeMode)
          }}
        >
          <Stack direction={{ base: 'column', sm: 'row' }} gap={4}>
            <RadioGroup.Item value="system">
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator />
              <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                {settings.theme.system}
              </RadioGroup.ItemText>{' '}
              {/* Font size responsive */}
            </RadioGroup.Item>
            <RadioGroup.Item value="dark">
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator />
              <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                {settings.theme.dark}
              </RadioGroup.ItemText>
            </RadioGroup.Item>
            <RadioGroup.Item value="light">
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator />
              <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                {settings.theme.light}
              </RadioGroup.ItemText>
            </RadioGroup.Item>
          </Stack>
        </RadioGroup.Root>
        <Text mt={2} color="textMuted" fontSize={{ base: 'sm', md: 'md' }}>
          {settings.theme.current.replace('{theme}', theme.resolved)}
        </Text>
      </GlassCard>
    </Box>
  )
}
