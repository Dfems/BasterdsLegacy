import { type JSX } from 'react'

import { Box, Heading, HStack, Stack, Text } from '@chakra-ui/react'

import { GlassCard } from '@/shared/components/GlassCard'
import useLanguage from '@/shared/hooks/useLanguage'

type ServerSettings = {
  javaBin: string
  mcDir: string
  backupDir: string
  rcon: { enabled: boolean; host: string; port: number }
  backupCron: string
  retentionDays: number
  retentionWeeks: number
}

type ServerInfoSectionProps = {
  settings: ServerSettings | null
  loading: boolean
  error: string | null
}

const InfoRow = ({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: string
}): JSX.Element => (
  <HStack justify="space-between" align="start" w="full">
    <HStack gap={2}>
      {icon && <Text fontSize="sm">{icon}</Text>}
      <Text fontWeight="medium" color="textMuted" fontSize={{ base: 'sm', md: 'md' }}>
        {label}:
      </Text>
    </HStack>
    <Text
      fontSize={{ base: 'sm', md: 'md' }}
      wordBreak="break-all"
      textAlign="right"
      maxW={{ base: '60%', md: '70%' }}
      fontFamily="mono"
    >
      {value}
    </Text>
  </HStack>
)

export const ServerInfoSection = ({
  settings,
  loading,
  error,
}: ServerInfoSectionProps): JSX.Element => {
  const { settings: t } = useLanguage()

  if (error) {
    return (
      <GlassCard inset p={{ base: 4, md: 6 }}>
        <Stack direction="column" gap={3}>
          <Heading size={{ base: 'sm', md: 'md' }} color="red.400">
            📊 Informazioni Server
          </Heading>
          <Text color="accent.danger" fontSize={{ base: 'sm', md: 'md' }}>
            {t.errorLoad}: {error}
          </Text>
        </Stack>
      </GlassCard>
    )
  }

  if (loading || !settings) {
    return (
      <GlassCard inset p={{ base: 4, md: 6 }}>
        <Stack direction="column" gap={3}>
          <Heading size={{ base: 'sm', md: 'md' }}>📊 Informazioni Server</Heading>
          <Text fontSize={{ base: 'sm', md: 'md' }}>{t.loading}</Text>
        </Stack>
      </GlassCard>
    )
  }

  return (
    <GlassCard inset p={{ base: 4, md: 6 }}>
      <Stack direction="column" gap={4}>
        <Box>
          <Heading size={{ base: 'sm', md: 'md' }} mb={2}>
            📊 Informazioni Server
          </Heading>
          <Text fontSize={{ base: 'xs', md: 'sm' }} color="textMuted">
            Configurazioni attualmente attive del server (sola lettura)
          </Text>
        </Box>

        <Stack direction="column" gap={3}>
          <InfoRow label="Eseguibile Java" value={settings.javaBin} icon="☕" />

          <InfoRow label="Directory Server" value={settings.mcDir} icon="📁" />

          <InfoRow label="Directory Backup" value={settings.backupDir} icon="💾" />

          <InfoRow
            label="RCON"
            value={
              settings.rcon.enabled ? `${settings.rcon.host}:${settings.rcon.port}` : 'Disabilitato'
            }
            icon="🔗"
          />

          <InfoRow label="Schedule Backup" value={settings.backupCron} icon="⏰" />

          <HStack justify="space-between" align="center" w="full">
            <HStack gap={2}>
              <Text fontSize="sm">📈</Text>
              <Text fontWeight="medium" color="textMuted" fontSize={{ base: 'sm', md: 'md' }}>
                Retention Policy:
              </Text>
            </HStack>
            <HStack gap={2}>
              <Box
                fontSize="xs"
                px={2}
                py={1}
                bg="blue.100"
                color="blue.800"
                borderRadius="md"
                border="1px solid"
                borderColor="blue.200"
              >
                {settings.retentionDays} giorni
              </Box>
              <Box
                fontSize="xs"
                px={2}
                py={1}
                bg="green.100"
                color="green.800"
                borderRadius="md"
                border="1px solid"
                borderColor="green.200"
              >
                {settings.retentionWeeks} settimane
              </Box>
            </HStack>
          </HStack>
        </Stack>
      </Stack>
    </GlassCard>
  )
}
