import { type JSX } from 'react'

import { Badge, Box, Link as ChakraLink, Grid, HStack, Stack, Text } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import { ModernHeader } from '@/shared/components/ModernHeader'
import { QuickActionCard } from '@/shared/components/QuickActionCard'
import { StatsCard } from '@/shared/components/StatsCard'
import { StatusIndicator } from '@/shared/components/StatusIndicator'
import { useButtonsSettings } from '@/shared/hooks/useButtonsSettings'
import useLanguage from '@/shared/hooks/useLanguage'
import { useModpackInfo } from '@/shared/hooks/useModpackInfo'
import { useServerJarStatus } from '@/shared/hooks/useServerJarStatus'

type Status = {
  state: 'RUNNING' | 'STOPPED' | 'CRASHED'
  pid: number | null
  uptimeMs: number
  cpu: number
  memMB: number
  running?: boolean
  disk?: {
    usedGB: number
    totalGB: number
    freeGB: number
  }
  players?: {
    online: number
    max: number
  }
  tickTimeMs?: number
  rconAvailable?: boolean
}

const fmtUptime = (ms: number): string => {
  const sec = Math.floor(ms / 1000)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h}h ${m}m ${s}s`
}

const LoggedInHomePage = (): JSX.Element => {
  const { home, common, ui, dashboard, navigation } = useLanguage()
  const { data: jarStatus } = useServerJarStatus()
  const { data: buttonsSettings } = useButtonsSettings()
  const { data: modpackInfo } = useModpackInfo()

  const { data: status, error } = useQuery({
    queryKey: ['status'],
    queryFn: async (): Promise<Status> => {
      const r = await fetch('/api/status')
      if (!r.ok) throw new Error('status error')
      return (await r.json()) as Status
    },
    refetchInterval: 5000,
    staleTime: 2000,
  })

  const isServerRunning = status?.state === 'RUNNING' || status?.running === true
  const displayVersion = modpackInfo?.version ?? buttonsSettings?.modpack.version ?? '1.0.0'

  return (
    <Box p={{ base: 4, md: 6, lg: 8 }} maxW="7xl" mx="auto">
      {/* Modern Header with Animation */}
      <ModernHeader
        title={home.loggedIn.welcomeBack}
        description={home.loggedIn.downloadSection}
        emoji="🎮"
        gradient="linear(135deg, blue.500/15, purple.500/15, pink.500/10)"
      />

      {/* Server Status Overview */}
      <Box mb={8}>
        <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" mb={4} color="accent.fg">
          🖥️ {ui.overview}
        </Text>
        <Grid
          templateColumns={{
            base: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
            xl: 'repeat(4, 1fr)',
          }}
          gap={{ base: 3, md: 4 }}
        >
          <StatsCard
            inset
            title={common.status}
            value={isServerRunning ? dashboard.online : dashboard.offline}
            icon="🟢"
            color={isServerRunning ? 'green.400' : 'red.400'}
            size="sm"
            badge={{
              text: isServerRunning ? home.loggedIn.serverRunning : home.loggedIn.serverStopped,
              color: isServerRunning ? 'green' : 'red',
            }}
            subtitle={status?.pid ? `PID: ${status.pid}` : dashboard.offline}
          />

          <StatsCard
            inset
            title={common.modpack}
            value={
              jarStatus?.hasJar ? home.loggedIn.modpackInstalled : home.loggedIn.modpackNotFound
            }
            icon="📦"
            color={jarStatus?.hasJar ? 'blue.400' : 'orange.400'}
            size="sm"
            badge={{
              text: jarStatus?.jarType?.toUpperCase() ?? dashboard.notAvailable,
              color: jarStatus?.hasJar ? 'blue' : 'orange',
            }}
            subtitle={(home.loggedIn.currentVersion ?? 'Version: {version}').replace(
              '{version}',
              displayVersion
            )}
          />

          <StatsCard
            inset
            title={ui.performance}
            value={status?.cpu ? `${status.cpu.toFixed(1)}%` : '-'}
            icon="⚡"
            color="yellow.400"
            size="sm"
            subtitle={
              status?.memMB ? `${dashboard.processMemory}: ${status.memMB} MB` : common.error
            }
            trend={
              status?.cpu && status.cpu > 0
                ? {
                    value: status.cpu,
                    isPositive: status.cpu < 50,
                  }
                : undefined
            }
          />

          <StatsCard
            inset
            title={dashboard.uptime}
            value={status?.uptimeMs ? fmtUptime(status.uptimeMs) : '-'}
            icon="⏱️"
            color="purple.400"
            size="sm"
            subtitle={isServerRunning ? home.loggedIn.serverRunning : home.loggedIn.serverStopped}
          />
        </Grid>
      </Box>

      {/* Main Dashboard Grid */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }} gap={{ base: 5, md: 6 }} mb={8}>
        {/* Quick Actions */}
        <QuickActionCard
          inset
          title={ui.quickActions}
          description={home.loggedIn.serverOverview}
          icon="⚡"
          gradient="linear(135deg, green.500/10, emerald.500/10)"
          size="sm"
        >
          <Stack gap={3}>
            <GlassButton as={ChakraLink} href="/app/dashboard" size="md" w="100%">
              <HStack>
                <Text>📊</Text>
                <Text>{ui.dashboard}</Text>
              </HStack>
            </GlassButton>

            <GlassButton as={ChakraLink} href="/app/console" size="md" w="100%">
              <HStack>
                <Text>💻</Text>
                <Text>{navigation.console}</Text>
              </HStack>
            </GlassButton>

            <GlassButton as={ChakraLink} href="/app/files" size="md" w="100%">
              <HStack>
                <Text>📁</Text>
                <Text>{navigation.files}</Text>
              </HStack>
            </GlassButton>

            <GlassButton as={ChakraLink} href="/app/modpack" size="md" w="100%">
              <HStack>
                <Text>📦</Text>
                <Text>{common.modpack}</Text>
              </HStack>
            </GlassButton>
          </Stack>
        </QuickActionCard>

        {/* System Information */}
        <QuickActionCard
          inset
          title={ui.systemInfo}
          description={ui.monitoringIntro ?? ''}
          icon="📊"
          gradient="linear(135deg, blue.500/10, cyan.500/10)"
          size="sm"
        >
          <Stack gap={4}>
            <StatusIndicator
              status={isServerRunning ? 'online' : 'offline'}
              label={navigation.server}
              details={status?.state ?? dashboard.unknown}
            />

            {status?.players && (
              <HStack justify="space-between">
                <Text fontSize="sm" color="textMuted">
                  {dashboard.playersOnline}:
                </Text>
                <Badge colorPalette="blue" variant="solid" fontSize="xs" px={2} py={0.5}>
                  {status.players.online}/{status.players.max}
                </Badge>
              </HStack>
            )}

            {status?.disk && (
              <HStack justify="space-between">
                <Text fontSize="sm" color="textMuted">
                  {dashboard.diskStorage}:
                </Text>
                <Text
                  fontSize="sm"
                  minW={0}
                  maxW={{ base: '55%', md: '60%' }}
                  textAlign="right"
                  truncate
                >
                  {status.disk.usedGB.toFixed(1)}/{status.disk.totalGB.toFixed(0)} GB
                </Text>
              </HStack>
            )}

            {status?.tickTimeMs && status.rconAvailable && (
              <HStack justify="space-between">
                <Text fontSize="sm" color="textMuted">
                  {dashboard.tickTime}:
                </Text>
                <Badge
                  colorPalette={
                    status.tickTimeMs <= 50 ? 'green' : status.tickTimeMs <= 55 ? 'yellow' : 'red'
                  }
                  variant="solid"
                >
                  {status.tickTimeMs.toFixed(1)}ms
                </Badge>
              </HStack>
            )}

            <GlassButton as={ChakraLink} href="/app/dashboard" size="sm" w="100%" variant="outline">
              {ui.viewDetails}
            </GlassButton>
          </Stack>
        </QuickActionCard>

        {/* Downloads & Support */}
        <QuickActionCard
          inset
          title={common.download}
          description={home.loggedIn.downloadSection}
          icon="📥"
          gradient="linear(135deg, purple.500/10, pink.500/10)"
          size="sm"
        >
          <Stack gap={3}>
            {buttonsSettings?.config.visible && (
              <GlassButton
                as={ChakraLink}
                href={buttonsSettings.config.path}
                download
                size="md"
                w="100%"
              >
                <HStack>
                  <Text>⚙️</Text>
                  <Text>{home.configBtn}</Text>
                </HStack>
              </GlassButton>
            )}

            {buttonsSettings?.launcher.visible && (
              <GlassButton
                as={ChakraLink}
                href={buttonsSettings.launcher.path}
                download
                size="md"
                w="100%"
              >
                <HStack>
                  <Text>🚀</Text>
                  <Text>{home.launcherBtn}</Text>
                </HStack>
              </GlassButton>
            )}

            <GlassButton
              as={ChakraLink}
              href="https://ko-fi.com/dfems"
              target="_blank"
              rel="noopener noreferrer"
              size="md"
              w="100%"
              colorPalette="purple"
            >
              <HStack>
                <Text>☕</Text>
                <Text>{home.donateBtn}</Text>
              </HStack>
            </GlassButton>
          </Stack>
        </QuickActionCard>
      </Grid>

      {/* Recent Activity & Alerts */}
      {error && (
        <GlassCard p={4} mb={6}>
          <HStack gap={3}>
            <Text fontSize="2xl">⚠️</Text>
            <Box>
              <Text fontWeight="bold" color="orange.400">
                {common.warning ?? 'Warning'}
              </Text>
              <Text fontSize="sm" color="textMuted">
                {common.error}: {(error as Error).message}
              </Text>
            </Box>
          </HStack>
        </GlassCard>
      )}

      {/* Footer */}
      <Box textAlign="center" pt={8} borderTopWidth="1px" borderColor="whiteAlpha.200">
        <Text fontSize={{ base: 'xs', md: 'sm' }} color="textMuted">
          {home.footer}
        </Text>
      </Box>
    </Box>
  )
}

export default LoggedInHomePage
