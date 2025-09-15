import type { JSX } from 'react'

import { Box, HStack, Text, VStack } from '@chakra-ui/react'

import { GlassCard } from '@/shared/components/GlassCard'
import { useTranslation } from '@/shared/libs/i18n'

type Settings = {
  javaBin: string
  mcDir: string
  backupDir: string
  rcon: { enabled: boolean; host: string; port: number }
  backupCron: string
  retentionDays: number
  retentionWeeks: number
}

type OverviewTabProps = {
  settings: Settings | null
  loading: boolean
  error: string | null
}

export const OverviewTab = ({ settings, loading, error }: OverviewTabProps): JSX.Element => {
  const { t } = useTranslation()

  if (loading) {
    return (
      <GlassCard inset>
        <VStack gap={4} p={6}>
          <Text fontSize="lg" color="textMuted">
            {t.settings.loading}
          </Text>
        </VStack>
      </GlassCard>
    )
  }

  if (error) {
    return (
      <GlassCard inset>
        <VStack gap={4} p={6}>
          <Text color="accent.danger" fontSize="md">
            {t.settings.errorLoad}: {error}
          </Text>
        </VStack>
      </GlassCard>
    )
  }

  if (!settings) {
    return (
      <GlassCard inset>
        <VStack gap={4} p={6}>
          <Text color="textMuted">{t.common.loading}</Text>
        </VStack>
      </GlassCard>
    )
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Hero Card */}
      <GlassCard
        bgGradient="linear(135deg, accent.100/10, accent.300/5)"
        borderColor="accent.200"
        p={8}
      >
        <VStack gap={4} textAlign="center">
          <Text fontSize="3xl">🎮</Text>
          <Text fontSize="xl" fontWeight="bold" color="accent.fg">
            {t.settings.tabs.overview.title}
          </Text>
          <Text color="textMuted" maxW="md">
            {t.settings.tabs.overview.description}
          </Text>
        </VStack>
      </GlassCard>

      {/* Configuration Cards Grid */}
      <VStack gap={4} align="stretch">
        {/* Java Configuration */}
        <GlassCard inset p={6}>
          <HStack gap={4} align="start">
            <Text fontSize="2xl">☕</Text>
            <Box flex={1}>
              <Text fontWeight="semibold" mb={2} fontSize="lg">
                Java Configuration
              </Text>
              <VStack align="start" gap={2}>
                <HStack justify="space-between" w="full">
                  <Text color="textMuted" fontSize="sm">
                    JAVA_BIN
                  </Text>
                  <Text
                    fontSize="sm"
                    fontFamily="mono"
                    bg="surface"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {settings.javaBin}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </HStack>
        </GlassCard>

        {/* Directories */}
        <GlassCard inset p={6}>
          <HStack gap={4} align="start">
            <Text fontSize="2xl">📁</Text>
            <Box flex={1}>
              <Text fontWeight="semibold" mb={2} fontSize="lg">
                Directory Configuration
              </Text>
              <VStack align="start" gap={2}>
                <HStack justify="space-between" w="full">
                  <Text color="textMuted" fontSize="sm">
                    MC_DIR
                  </Text>
                  <Text
                    fontSize="sm"
                    fontFamily="mono"
                    bg="surface"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {settings.mcDir}
                  </Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text color="textMuted" fontSize="sm">
                    BACKUP_DIR
                  </Text>
                  <Text
                    fontSize="sm"
                    fontFamily="mono"
                    bg="surface"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {settings.backupDir}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </HStack>
        </GlassCard>

        {/* RCON Status */}
        <GlassCard inset p={6}>
          <HStack gap={4} align="start">
            <Text fontSize="2xl">🔌</Text>
            <Box flex={1}>
              <Text fontWeight="semibold" mb={2} fontSize="lg">
                RCON Status
              </Text>
              <HStack justify="space-between" w="full">
                <Text color="textMuted" fontSize="sm">
                  Connection
                </Text>
                <HStack gap={2}>
                  <Box
                    w={2}
                    h={2}
                    borderRadius="full"
                    bg={settings.rcon.enabled ? 'green.500' : 'red.500'}
                  />
                  <Text
                    fontSize="sm"
                    fontFamily="mono"
                    bg="surface"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {settings.rcon.enabled
                      ? `${settings.rcon.host}:${settings.rcon.port}`
                      : 'disabled'}
                  </Text>
                </HStack>
              </HStack>
            </Box>
          </HStack>
        </GlassCard>

        {/* Backup Configuration */}
        <GlassCard inset p={6}>
          <HStack gap={4} align="start">
            <Text fontSize="2xl">💾</Text>
            <Box flex={1}>
              <Text fontWeight="semibold" mb={2} fontSize="lg">
                Backup Configuration
              </Text>
              <VStack align="start" gap={2}>
                <HStack justify="space-between" w="full">
                  <Text color="textMuted" fontSize="sm">
                    Schedule (CRON)
                  </Text>
                  <Text
                    fontSize="sm"
                    fontFamily="mono"
                    bg="surface"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {settings.backupCron}
                  </Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text color="textMuted" fontSize="sm">
                    Retention
                  </Text>
                  <Text
                    fontSize="sm"
                    fontFamily="mono"
                    bg="surface"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {settings.retentionDays} days, {settings.retentionWeeks} weeks
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </HStack>
        </GlassCard>
      </VStack>
    </VStack>
  )
}
