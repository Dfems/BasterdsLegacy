import type { JSX } from 'react'

import { Box, HStack, Text, VStack } from '@chakra-ui/react'

import { EnvironmentConfigForm } from '@/features/environment-config'
import { GlassCard } from '@/shared/components/GlassCard'
import { useTranslation } from '@/shared/libs/i18n'

type EnvironmentConfig = {
  javaBin: string
  mcDir: string
  backupDir: string
  rconEnabled: boolean
  rconHost: string
  rconPort: number
  rconPass: string
  // Configurazioni logging
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  logDir: string
  logFileEnabled: boolean
  logRetentionDays: number
  logMaxFiles: number
  // Configurazioni pulsanti
  launcherBtnVisible: boolean
  launcherBtnPath: string
  configBtnVisible: boolean
  configBtnPath: string
  // Configurazioni modpack corrente
  currentModpack: string
  currentVersion: string
}

type EnvironmentTabProps = {
  envConfig: EnvironmentConfig | null
  envLoading: boolean
  envError: string | null
  onSave: (config: Partial<EnvironmentConfig>) => Promise<void>
  isOwner: boolean
}

export const EnvironmentTab = ({
  envConfig,
  envLoading,
  envError,
  onSave,
  isOwner,
}: EnvironmentTabProps): JSX.Element => {
  const { t } = useTranslation()

  if (!isOwner) {
    return (
      <GlassCard inset>
        <VStack gap={4} p={6}>
          <Text fontSize="2xl">🔒</Text>
          <Text fontSize="lg" color="textMuted" textAlign="center">
            {t.settings.ownerOnlyTitle}
          </Text>
          <Text color="textMuted" textAlign="center" fontSize="sm">
            {t.settings.ownerOnlyDescription}
          </Text>
        </VStack>
      </GlassCard>
    )
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Hero Card */}
      <GlassCard
        inset
        bgGradient="linear(135deg, blue.100/10, cyan.300/5)"
        borderColor="blue.200"
        p={8}
      >
        <VStack gap={4} textAlign="center">
          <Text fontSize="3xl">⚙️</Text>
          <Text fontSize="xl" fontWeight="bold" color="blue.fg">
            {t.settings.tabs.environment.title}
          </Text>
          <Text color="textMuted" maxW="md">
            {t.settings.tabs.environment.description}
          </Text>
        </VStack>
      </GlassCard>

      {/* Error Display */}
      {envError && (
        <GlassCard inset p={6} borderColor="red.200" bg="red.50/10">
          <HStack gap={4}>
            <Text fontSize="2xl">⚠️</Text>
            <Box>
              <Text color="red.500" fontWeight="semibold" mb={1}>
                {t.settings.errorLoad}
              </Text>
              <Text color="red.400" fontSize="sm">
                {envError}
              </Text>
            </Box>
          </HStack>
        </GlassCard>
      )}

      {/* Environment Configuration Form */}
      {envConfig && (
        <Box>
          <EnvironmentConfigForm initialConfig={envConfig} onSave={onSave} loading={envLoading} />
        </Box>
      )}

      {/* Loading State */}
      {envLoading && !envConfig && (
        <GlassCard inset>
          <VStack gap={4} p={6}>
            <Text fontSize="2xl">⏳</Text>
            <Text color="textMuted">{t.settings.loading}</Text>
          </VStack>
        </GlassCard>
      )}
    </VStack>
  )
}
