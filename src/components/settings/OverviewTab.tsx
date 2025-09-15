import { useEffect, useState, type JSX } from 'react'

import { Box, HStack, Stack, Text, VStack } from '@chakra-ui/react'

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

  type BackupScheduleConfig = {
    enabled: boolean
    frequency: 'daily' | 'every_2_days' | 'every_3_days' | 'weekly' | 'custom' | 'disabled'
    mode: 'full' | 'world'
    dailyAt?: string
    weeklyOn?: number
    cronPattern?: string
    multipleDaily?: string[]
  }

  const [schedule, setSchedule] = useState<BackupScheduleConfig | null>(null)

  useEffect(() => {
    if (!settings) return
    const run = async () => {
      try {
        const r = await fetch('/api/backups/schedule')
        if (!r?.ok) return
        const data = (await r.json()) as { config?: BackupScheduleConfig }
        if (data?.config) setSchedule(data.config)
      } catch {
        // ignora: useremo il fallback da settings
      }
    }
    void run()
  }, [settings])

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
        inset
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
                {t.settings.overview.java}
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
                {t.settings.overview.directories}
              </Text>
              <VStack align="start" gap={2}>
                <Stack
                  direction={{ base: 'column', md: 'row' }}
                  justify="space-between"
                  w="full"
                  gap={{ base: 1, md: 2 }}
                >
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
                    maxW={{ base: '100%', md: '70%' }}
                    overflowWrap="anywhere"
                    wordBreak="break-word"
                    whiteSpace="pre-wrap"
                  >
                    {settings.mcDir}
                  </Text>
                </Stack>
                <Stack
                  direction={{ base: 'column', md: 'row' }}
                  justify="space-between"
                  w="full"
                  gap={{ base: 1, md: 2 }}
                >
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
                    maxW={{ base: '100%', md: '70%' }}
                    overflowWrap="anywhere"
                    wordBreak="break-word"
                    whiteSpace="pre-wrap"
                  >
                    {settings.backupDir}
                  </Text>
                </Stack>
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
                {t.settings.overview.rconStatus}
              </Text>
              <HStack justify="space-between" w="full">
                <Text color="textMuted" fontSize="sm">
                  {t.settings.overview.connection}
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
                      : t.settings.overview.disabled}
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
                {t.settings.overview.backup}
              </Text>
              <VStack align="start" gap={2}>
                {/* Backup Schedule (DB o fallback) */}
                {schedule ? (
                  <>
                    <HStack justify="space-between" w="full">
                      <Text color="textMuted" fontSize="sm">
                        {t.backups.schedule.status}
                      </Text>
                      <Text
                        fontSize="sm"
                        fontFamily="mono"
                        bg="surface"
                        px={2}
                        py={1}
                        borderRadius="md"
                      >
                        {schedule.enabled
                          ? t.backups.schedule.enabled
                          : t.backups.schedule.disabled}
                      </Text>
                    </HStack>

                    <HStack justify="space-between" w="full">
                      <Text color="textMuted" fontSize="sm">
                        {t.backups.schedule.frequency}
                      </Text>
                      <Text
                        fontSize="sm"
                        fontFamily="mono"
                        bg="surface"
                        px={2}
                        py={1}
                        borderRadius="md"
                      >
                        {
                          t.backups.schedule.frequency_options[
                            schedule.frequency === 'disabled' ? 'custom' : schedule.frequency
                          ]
                        }
                      </Text>
                    </HStack>

                    <HStack justify="space-between" w="full">
                      <Text color="textMuted" fontSize="sm">
                        {t.backups.schedule.mode}
                      </Text>
                      <Text
                        fontSize="sm"
                        fontFamily="mono"
                        bg="surface"
                        px={2}
                        py={1}
                        borderRadius="md"
                      >
                        {t.backups.schedule.mode_options[schedule.mode]}
                      </Text>
                    </HStack>

                    {schedule.frequency === 'weekly' && typeof schedule.weeklyOn === 'number' && (
                      <HStack justify="space-between" w="full">
                        <Text color="textMuted" fontSize="sm">
                          {t.backups.schedule.day}
                        </Text>
                        <Text
                          fontSize="sm"
                          fontFamily="mono"
                          bg="surface"
                          px={2}
                          py={1}
                          borderRadius="md"
                        >
                          {
                            t.backups.schedule.day_options[
                              (schedule.weeklyOn as unknown as 0 | 1 | 2 | 3 | 4 | 5 | 6) ?? 0
                            ]
                          }
                        </Text>
                      </HStack>
                    )}

                    {(schedule.dailyAt ||
                      (schedule.multipleDaily && schedule.multipleDaily.length > 0)) && (
                      <HStack justify="space-between" w="full">
                        <Text color="textMuted" fontSize="sm">
                          {t.backups.schedule.time}
                        </Text>
                        <Text
                          fontSize="sm"
                          fontFamily="mono"
                          bg="surface"
                          px={2}
                          py={1}
                          borderRadius="md"
                        >
                          {schedule.multipleDaily && schedule.multipleDaily.length > 0
                            ? schedule.multipleDaily.join(', ')
                            : schedule.dailyAt}
                        </Text>
                      </HStack>
                    )}

                    {schedule.frequency === 'custom' && schedule.cronPattern && (
                      <HStack justify="space-between" w="full">
                        <Text color="textMuted" fontSize="sm">
                          CRON
                        </Text>
                        <Text
                          fontSize="sm"
                          fontFamily="mono"
                          bg="surface"
                          px={2}
                          py={1}
                          borderRadius="md"
                        >
                          {schedule.cronPattern}
                        </Text>
                      </HStack>
                    )}
                  </>
                ) : (
                  <HStack justify="space-between" w="full">
                    <Text color="textMuted" fontSize="sm">
                      {t.settings.overview.schedule}
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
                )}

                {/* Retention Policy (ENV) */}
                <HStack justify="space-between" w="full">
                  <Text color="textMuted" fontSize="sm">
                    {t.settings.overview.retention}
                  </Text>
                  <Text
                    fontSize="sm"
                    fontFamily="mono"
                    bg="surface"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {settings.retentionDays} {t.settings.overview.days}, {settings.retentionWeeks}{' '}
                    {t.settings.overview.weeks}
                  </Text>
                </HStack>
                {t.settings.overview.retentionHelp && (
                  <Text color="textMuted" fontSize="xs">
                    {t.settings.overview.retentionHelp}
                  </Text>
                )}
              </VStack>
            </Box>
          </HStack>
        </GlassCard>
      </VStack>
    </VStack>
  )
}
