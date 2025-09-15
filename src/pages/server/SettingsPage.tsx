import { useEffect, useState, type JSX } from 'react'

import { Box, Heading, Text } from '@chakra-ui/react'

import {
  AdvancedTab,
  EnvironmentTab,
  OverviewTab,
  ServerTab,
  SettingsTabNavigation,
  type SettingsTab,
  UiTab,
} from '@/components/settings'
import { useUiSettings } from '@/shared/hooks'
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

export default function SettingsPage(): JSX.Element {
  const { t } = useTranslation()
  const { isOwner } = useUiSettings()

  const [activeTab, setActiveTab] = useState<SettingsTab>('overview')
  const [s, setS] = useState<Settings | null>(null)
  const [envConfig, setEnvConfig] = useState<EnvironmentConfig | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [envErr, setEnvErr] = useState<string | null>(null)
  const [envLoading, setEnvLoading] = useState(false)

  // Determina quali tab sono disponibili basandosi sui permessi
  const availableTabs: SettingsTab[] = [
    'overview',
    'ui',
    ...(isOwner ? (['environment', 'server', 'advanced'] as const) : []),
  ]

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

  const renderTabContent = (): JSX.Element => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab settings={s} loading={false} error={err} />

      case 'environment':
        return (
          <EnvironmentTab
            envConfig={envConfig}
            envLoading={envLoading}
            envError={envErr}
            onSave={handleEnvConfigSave}
            isOwner={isOwner}
          />
        )

      case 'ui':
        return <UiTab isOwner={isOwner} />

      case 'server':
        return (
          <ServerTab
            envConfig={envConfig}
            envLoading={envLoading}
            onSave={handleEnvConfigSave}
            isOwner={isOwner}
          />
        )

      case 'advanced':
        return <AdvancedTab />

      default:
        return <OverviewTab settings={s} loading={false} error={err} />
    }
  }

  return (
    <Box p={{ base: 4, md: 6, lg: 8 }} maxW="6xl" mx="auto">
      {/* Header con gradiente e animazione */}
      <Box
        mb={8}
        textAlign="center"
        bgGradient="linear(135deg, accent.200/20, accent.400/10)"
        borderRadius="2xl"
        p={8}
        position="relative"
        overflow="hidden"
      >
        {/* Animated background elements */}
        <Box
          position="absolute"
          top="-50%"
          right="-50%"
          w="200%"
          h="200%"
          bgGradient="radial(circle, accent.300/5, transparent 70%)"
          animation="spin 20s linear infinite"
        />

        <Box position="relative" zIndex={1}>
          <Text fontSize="4xl" mb={2}>
            ⚙️
          </Text>
          <Heading fontSize={{ base: '2xl', md: '3xl', lg: '4xl' }} mb={4} color="accent.fg">
            {t.settings.title}
          </Heading>
          <Text color="textMuted" fontSize={{ base: 'md', md: 'lg' }} maxW="2xl" mx="auto">
            Gestisci e personalizza ogni aspetto del tuo server Minecraft con un'interfaccia moderna
            e intuitiva
          </Text>
        </Box>
      </Box>

      {/* Tab Navigation */}
      <Box mb={8}>
        <SettingsTabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          availableTabs={availableTabs}
        />
      </Box>

      {/* Tab Content */}
      <Box minH="500px" position="relative">
        {/* Animated content transition */}
        <Box
          key={activeTab}
          opacity={0}
          transform="translateY(20px)"
          animation="fadeIn 0.3s ease-out forwards"
          css={{
            '@keyframes fadeIn': {
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          {renderTabContent()}
        </Box>
      </Box>
    </Box>
  )
}
