import { type JSX } from 'react'

import { Box, Heading, HStack, Kbd, Stack, Text } from '@chakra-ui/react'

import { EnvironmentConfigForm } from '@/features/environment-config'
import { GlassCard } from '@/shared/components/GlassCard'
import { useUiSettings } from '@/shared/hooks'
import useLanguage from '@/shared/hooks/useLanguage'

type EnvironmentConfig = {
  javaBin: string
  mcDir: string
  backupDir: string
  rconEnabled: boolean
  rconHost: string
  rconPort: number
  rconPass: string
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  logDir: string
  logFileEnabled: boolean
  logRetentionDays: number
  logMaxFiles: number
}

type AdvancedSectionProps = {
  envConfig: EnvironmentConfig | null
  envError: string | null
  envLoading: boolean
  onEnvConfigSave: (changes: Partial<EnvironmentConfig>) => Promise<void>
}

export const AdvancedSection = ({
  envConfig,
  envError,
  envLoading,
  onEnvConfigSave,
}: AdvancedSectionProps): JSX.Element => {
  const { settings: t } = useLanguage()
  const { isOwner } = useUiSettings()

  if (!isOwner) {
    return <></>
  }

  return (
    <Stack direction="column" gap={6}>
      {/* Configurazioni Ambiente */}
      <GlassCard inset p={{ base: 4, md: 6 }}>
        <Stack direction="column" gap={4}>
          <Box>
            <Heading size={{ base: 'sm', md: 'md' }} mb={2}>
              ⚙️ Configurazioni Ambiente
            </Heading>
            <Text fontSize={{ base: 'xs', md: 'sm' }} color="textMuted">
              {t.environment.description}
            </Text>
          </Box>

          {envError && (
            <Text color="accent.danger" fontSize={{ base: 'sm', md: 'md' }}>
              {t.errorLoad}: {envError}
            </Text>
          )}

          {envConfig && (
            <EnvironmentConfigForm
              initialConfig={envConfig}
              onSave={onEnvConfigSave}
              loading={envLoading}
            />
          )}
        </Stack>
      </GlassCard>

      {/* SFTP Section */}
      <GlassCard inset p={{ base: 4, md: 6 }}>
        <Stack direction="column" gap={3}>
          <Box>
            <Heading size="xs" mb={2} color="textPrimary">
              🔐 {t.sftp.title}
            </Heading>
            <Text fontSize={{ base: 'xs', md: 'sm' }} color="textMuted" mb={3}>
              {t.sftp.description}
            </Text>
          </Box>

          <HStack gap={2} wrap="wrap">
            <Kbd fontSize={{ base: 'xs', md: 'sm' }}>{t.sftp.ssh}</Kbd>
            <Text fontSize={{ base: 'sm', md: 'md' }}>{t.sftp.user}</Text>
          </HStack>
        </Stack>
      </GlassCard>
    </Stack>
  )
}
