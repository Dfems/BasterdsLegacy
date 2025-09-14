import { useEffect, useState, type JSX } from 'react'

import {
  Box,
  Heading,
  HStack,
  TabsContent,
  TabsIndicator,
  TabsList,
  TabsRoot,
  TabsTrigger,
  Text,
  VStack,
} from '@chakra-ui/react'
import { FiActivity, FiEye, FiImage, FiMonitor, FiSettings, FiTool } from 'react-icons/fi'

import {
  AdvancedTabContent,
  AppearanceTabContent,
  OverviewTabContent,
  SystemTabContent,
} from '@/features/settings-tabs'
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
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  logDir: string
  logFileEnabled: boolean
  logRetentionDays: number
  logMaxFiles: number
}

type TabConfig = {
  id: string
  label: string
  icon: JSX.Element
  color: string
  description: string
}

const TABS: TabConfig[] = [
  {
    id: 'overview',
    label: 'Panoramica',
    icon: <FiMonitor />,
    color: 'blue.400',
    description: 'Stato generale del server',
  },
  {
    id: 'appearance',
    label: 'Aspetto',
    icon: <FiImage />,
    color: 'purple.400',
    description: 'Personalizza interfaccia',
  },
  {
    id: 'system',
    label: 'Sistema',
    icon: <FiTool />,
    color: 'green.400',
    description: 'Configurazioni server',
  },
  {
    id: 'advanced',
    label: 'Avanzate',
    icon: <FiSettings />,
    color: 'red.400',
    description: 'Opzioni per esperti',
  },
]

export default function SettingsPage(): JSX.Element {
  const { settings } = useLanguage()
  const { isOwner } = useUiSettings()
  const [s, setS] = useState<Settings | null>(null)
  const [envConfig, setEnvConfig] = useState<EnvironmentConfig | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [envErr, setEnvErr] = useState<string | null>(null)
  const [envLoading, setEnvLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

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

    try {
      const basicResponse = await fetch('/api/settings')
      if (basicResponse.ok) {
        setS((await basicResponse.json()) as Settings)
      }
    } catch {
      // Ignora gli errori della ricaricatura basic
    }
  }

  const availableTabs = TABS.filter((tab) => tab.id !== 'advanced' || isOwner)

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, var(--chakra-colors-chakra-body-bg), transparent)"
      p={{ base: 4, md: 6, lg: 8 }}
    >
      <VStack gap={8} maxW="8xl" mx="auto">
        {/* Header rivoluzionario con animazioni */}
        <GlassCard inset p={{ base: 6, md: 8 }} w="full">
          <VStack gap={4} textAlign="center">
            <HStack gap={3} justify="center">
              <Box
                p={3}
                rounded="full"
                bgGradient="linear(45deg, blue.400, purple.500)"
                color="white"
                animation="pulse 2s infinite"
              >
                <FiActivity size="24" />
              </Box>
              <Heading
                size={{ base: 'lg', md: 'xl', lg: '2xl' }}
                bgGradient="linear(45deg, blue.400, purple.500)"
                bgClip="text"
                fontWeight="bold"
              >
                {settings.title}
              </Heading>
            </HStack>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color="textMuted"
              maxW="2xl"
              lineHeight="tall"
            >
              Gestisci e personalizza il tuo server
            </Text>
          </VStack>
        </GlassCard>

        {/* Sistema di tabs moderno */}
        <TabsRoot
          value={activeTab}
          onValueChange={(details) => setActiveTab(details.value)}
          w="full"
          variant="enclosed"
        >
          {/* Tab Navigation con design moderno */}
          <GlassCard p={2} mb={6}>
            <TabsList rounded="xl" bg="transparent" gap={2}>
              {availableTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  flex="1"
                  rounded="lg"
                  height={20}
                  p={4}
                  transition="all 0.3s ease"
                  _selected={{
                    bg: 'white',
                    shadow: 'lg',
                    transform: 'translateY(-2px)',
                  }}
                  _hover={{
                    transform: 'translateY(-1px)',
                    shadow: 'md',
                  }}
                >
                  <VStack gap={2} w="full">
                    <HStack gap={2} justify="center">
                      <Box color={tab.color} fontSize="xl">
                        {tab.icon}
                      </Box>
                      <Text fontWeight="semibold" fontSize={{ base: 'sm', md: 'md' }}>
                        {tab.label}
                      </Text>
                    </HStack>
                    <Text
                      fontSize="xs"
                      color="textMuted"
                      textAlign="center"
                      display={{ base: 'none', md: 'block' }}
                    >
                      {tab.description}
                    </Text>
                  </VStack>
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsIndicator />
          </GlassCard>

          {/* Tab Content con animazioni */}
          <Box w="full">
            <TabsContent value="overview">
              <OverviewTabContent settings={s} loading={!s && !err} error={err} isOwner={isOwner} />
            </TabsContent>

            <TabsContent value="appearance">
              <AppearanceTabContent isOwner={isOwner} />
            </TabsContent>

            <TabsContent value="system">
              <SystemTabContent
                envConfig={envConfig}
                envError={envErr}
                envLoading={envLoading}
                onEnvConfigSave={handleEnvConfigSave}
                isOwner={isOwner}
              />
            </TabsContent>

            {isOwner && (
              <TabsContent value="advanced">
                <AdvancedTabContent
                  envConfig={envConfig}
                  envError={envErr}
                  envLoading={envLoading}
                  onEnvConfigSave={handleEnvConfigSave}
                />
              </TabsContent>
            )}
          </Box>
        </TabsRoot>

        {/* Footer con informazioni utili */}
        <GlassCard inset p={4} w="full">
          <HStack justify="center" gap={4} wrap="wrap">
            <HStack gap={2}>
              <FiEye color="var(--chakra-colors-textMuted)" />
              <Text fontSize="sm" color="textMuted">
                {isOwner ? 'Modalità Proprietario' : 'Modalità Visualizzazione'}
              </Text>
            </HStack>
            <Text fontSize="sm" color="textMuted">
              •
            </Text>
            <Text fontSize="sm" color="textMuted">
              Ultima modifica: {new Date().toLocaleDateString('it-IT')}
            </Text>
          </HStack>
        </GlassCard>
      </VStack>
    </Box>
  )
}
