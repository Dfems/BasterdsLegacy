import { useEffect, useState, type JSX } from 'react'

import { Box, Heading, HStack, Kbd, RadioGroup, Stack, Text } from '@chakra-ui/react'

import { useThemeMode, type ThemeMode } from '@/entities/user/ThemeModeContext'
import { EnvironmentConfigForm } from '@/features/environment-config'
import { BackgroundUpload } from '@/shared/components/BackgroundUpload'
import { GlassCard } from '@/shared/components/GlassCard'
import { useUiSettings } from '@/shared/hooks'
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

type EnvironmentConfig = {
  javaBin: string
  mcDir: string
  backupDir: string
  rconEnabled: boolean
  rconHost: string
  rconPort: number
  rconPass: string
}

export default function SettingsPage(): JSX.Element {
  const { settings } = useLanguage()
  const theme = useThemeMode()
  const { isOwner } = useUiSettings()
  const [s, setS] = useState<Settings | null>(null)
  const [envConfig, setEnvConfig] = useState<EnvironmentConfig | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [envErr, setEnvErr] = useState<string | null>(null)
  const [envLoading, setEnvLoading] = useState(false)

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

  useEffect(() => {
    if (!isOwner) return

    const loadEnvConfig = async () => {
      setEnvLoading(true)
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/settings/environment', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!response.ok) throw new Error('Failed to load environment config')
        setEnvConfig((await response.json()) as EnvironmentConfig)
      } catch (e) {
        setEnvErr((e as Error).message)
      } finally {
        setEnvLoading(false)
      }
    }
    void loadEnvConfig()
  }, [isOwner])

  const handleEnvConfigSave = async (changes: Partial<EnvironmentConfig>): Promise<void> => {
    if (!isOwner) throw new Error('Unauthorized')

    const token = localStorage.getItem('token')
    const response = await fetch('/api/settings/environment', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(changes),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update environment config')
    }

    const result = await response.json()
    setEnvConfig(result.config)

    // Ricarica anche le impostazioni di base per sincronizzare
    try {
      const basicResponse = await fetch('/api/settings')
      if (basicResponse.ok) {
        setS((await basicResponse.json()) as Settings)
      }
    } catch {
      // Ignora gli errori della ricaricatura basic
    }
  }

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Heading mb={4} fontSize={{ base: 'md', md: 'lg' }}>
        {settings.title}
      </Heading>

      {/* Current Settings View */}
      {err && (
        <Text color="accent.danger" fontSize={{ base: 'sm', md: 'md' }}>
          {settings.errorLoad}: {err}
        </Text>
      )}
      {!s && !err && <Text fontSize={{ base: 'sm', md: 'md' }}>{settings.loading}</Text>}
      {s && (
        <GlassCard
          inset
          as="dl"
          display="grid"
          gap={3}
          gridTemplateColumns={{ base: '1fr', sm: 'max-content 1fr' }}
          mb={6}
          p={{ base: 3, md: 4 }}
        >
          <Text as="dt" color="textMuted" fontSize={{ base: 'sm', md: 'md' }}>
            JAVA_BIN
          </Text>
          <Text as="dd" fontSize={{ base: 'sm', md: 'md' }} wordBreak="break-all">
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

      {/* Environment Configuration Form - Solo per owner */}
      {isOwner && (
        <Box mb={6}>
          {envErr && (
            <Text color="accent.danger" fontSize={{ base: 'sm', md: 'md' }} mb={4}>
              Errore caricamento configurazioni: {envErr}
            </Text>
          )}
          {envConfig && (
            <EnvironmentConfigForm
              initialConfig={envConfig}
              onSave={handleEnvConfigSave}
              loading={envLoading}
            />
          )}
        </Box>
      )}

      {/* Background Upload - Solo per owner */}
      {isOwner && (
        <Box mb={6}>
          <BackgroundUpload />
        </Box>
      )}

      {/* SFTP Section */}
      <GlassCard inset p={{ base: 3, md: 4 }}>
        <Heading size={{ base: 'sm', md: 'md' }} mb={2}>
          {settings.sftp.title}
        </Heading>
        <Text mb={2} fontSize={{ base: 'sm', md: 'md' }}>
          {settings.sftp.description}
        </Text>
        <HStack gap={2} wrap="wrap">
          <Kbd fontSize={{ base: 'xs', md: 'sm' }}>{settings.sftp.ssh}</Kbd>
          <Text fontSize={{ base: 'sm', md: 'md' }}>{settings.sftp.user}</Text>
        </HStack>
      </GlassCard>

      {/* Theme Section */}
      <GlassCard inset mt={6} p={{ base: 3, md: 4 }}>
        <Heading size={{ base: 'sm', md: 'md' }} mb={3}>
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
              </RadioGroup.ItemText>
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
