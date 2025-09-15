import type { JSX } from 'react'

import { Box, HStack, Kbd, Text, VStack } from '@chakra-ui/react'

import { GlassCard } from '@/shared/components/GlassCard'
import { useTranslation } from '@/shared/libs/i18n'

export const AdvancedTab = (): JSX.Element => {
  const { t } = useTranslation()

  return (
    <VStack gap={6} align="stretch">
      {/* Hero Card */}
      <GlassCard
        inset
        bgGradient="linear(135deg, orange.100/10, red.300/5)"
        borderColor="orange.200"
        p={8}
      >
        <VStack gap={4} textAlign="center">
          <Text fontSize="3xl">🔧</Text>
          <Text fontSize="xl" fontWeight="bold" color="orange.fg">
            {t.settings.tabs.advanced.title}
          </Text>
          <Text color="textMuted" maxW="md">
            {t.settings.tabs.advanced.description}
          </Text>
        </VStack>
      </GlassCard>

      {/* SFTP Configuration */}
      <GlassCard inset p={6}>
        <HStack gap={4} align="start">
          <Text fontSize="2xl">📁</Text>
          <Box flex={1}>
            <Text fontWeight="semibold" mb={2} fontSize="lg">
              {t.settings.sftp.title}
            </Text>
            <Text color="textMuted" fontSize="sm" mb={4}>
              {t.settings.sftp.description}
            </Text>

            <VStack align="start" gap={3}>
              <Box>
                <Text fontSize="sm" color="textMuted" mb={2}>
                  {t.settings.sftp.commandLabel ?? 'SSH Command:'}
                </Text>
                <HStack gap={2} wrap="wrap">
                  <Kbd fontSize="sm">{t.settings.sftp.ssh}</Kbd>
                  <Text fontSize="sm">{t.settings.sftp.user}</Text>
                </HStack>
              </Box>

              <Box
                bg="surface"
                borderRadius="md"
                p={4}
                borderWidth="1px"
                borderColor="borderAccent"
                w="full"
              >
                <Text fontSize="xs" color="textMuted" mb={2}>
                  {t.settings.sftp.exampleLabel ?? 'Connection example:'}
                </Text>
                <Text fontSize="sm" fontFamily="mono" color="text">
                  {t.settings.sftp.exampleSsh ?? 'ssh minecraft@your-server.com'}
                </Text>
              </Box>
            </VStack>
          </Box>
        </HStack>
      </GlassCard>

      {/* Security Information */}
      <GlassCard inset p={6}>
        <HStack gap={4} align="start">
          <Text fontSize="2xl">🔐</Text>
          <Box flex={1}>
            <Text fontWeight="semibold" mb={2} fontSize="lg">
              {t.settings.advancedInfo?.security.title ?? t.settings.tabs.advanced.title}
            </Text>
            <Text color="textMuted" fontSize="sm" mb={4}>
              {t.settings.advancedInfo?.security.description ??
                t.settings.tabs.advanced.description}
            </Text>

            <VStack align="start" gap={3}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  🔑 {t.settings.advancedInfo?.security.authTitle ?? ''}
                </Text>
                <Text fontSize="sm" color="textMuted">
                  {t.settings.advancedInfo?.security.authDescription ?? t.settings.sftp.description}
                </Text>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  📂 {t.settings.advancedInfo?.security.permsTitle ?? ''}
                </Text>
                <Text fontSize="sm" color="textMuted">
                  {t.settings.advancedInfo?.security.permsDescription ?? ''}
                </Text>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  🔄 {t.settings.advancedInfo?.security.backupsTitle ?? ''}
                </Text>
                <Text fontSize="sm" color="textMuted">
                  {t.settings.advancedInfo?.security.backupsDescription ?? ''}
                </Text>
              </Box>
            </VStack>
          </Box>
        </HStack>
      </GlassCard>

      {/* System Information */}
      <GlassCard inset p={6}>
        <HStack gap={4} align="start">
          <Text fontSize="2xl">💻</Text>
          <Box flex={1}>
            <Text fontWeight="semibold" mb={2} fontSize="lg">
              {t.settings.advancedInfo?.system.title ?? 'System Information'}
            </Text>
            <Text color="textMuted" fontSize="sm" mb={4}>
              {t.settings.advancedInfo?.system.description ??
                'Technical details of server and environment'}
            </Text>

            <VStack align="start" gap={3}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  🐧 {t.settings.advancedInfo?.system.osTitle ?? ''}
                </Text>
                <Text fontSize="sm" color="textMuted">
                  {t.settings.advancedInfo?.system.osDescription ?? ''}
                </Text>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  ☕ {t.settings.advancedInfo?.system.javaTitle ?? ''}
                </Text>
                <Text fontSize="sm" color="textMuted">
                  {t.settings.advancedInfo?.system.javaDescription ?? ''}
                </Text>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  🔧 {t.settings.advancedInfo?.system.processesTitle ?? ''}
                </Text>
                <Text fontSize="sm" color="textMuted">
                  {t.settings.advancedInfo?.system.processesDescription ?? ''}
                </Text>
              </Box>
            </VStack>
          </Box>
        </HStack>
      </GlassCard>

      {/* Warning Notice */}
      <GlassCard inset p={6} borderColor="amber.300" bg="amber.50/10">
        <HStack gap={4} align="start">
          <Text fontSize="2xl">⚠️</Text>
          <Box flex={1}>
            <Text fontWeight="semibold" mb={2} fontSize="lg" color="amber.600">
              {t.settings.advancedInfo?.warning.title ?? 'Warning'}
            </Text>
            <VStack align="start" gap={2}>
              <Text fontSize="sm" color="amber.700">
                • {t.settings.advancedInfo?.warning.stability ?? ''}
              </Text>
              <Text fontSize="sm" color="amber.700">
                • {t.settings.advancedInfo?.warning.backups ?? ''}
              </Text>
              <Text fontSize="sm" color="amber.700">
                • {t.settings.advancedInfo?.warning.contactAdmin ?? ''}
              </Text>
            </VStack>
          </Box>
        </HStack>
      </GlassCard>
    </VStack>
  )
}
