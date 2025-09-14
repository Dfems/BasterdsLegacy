import { useEffect, useState, type JSX } from 'react'

import { Box, Heading, Stack } from '@chakra-ui/react'

import {
  AdvancedSection,
  ServerInfoSection,
  UserInterfaceSection,
} from '@/features/settings-sections'
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
  // Configurazioni logging
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  logDir: string
  logFileEnabled: boolean
  logRetentionDays: number
  logMaxFiles: number
}

export default function SettingsPage(): JSX.Element {
  const { settings } = useLanguage()
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
      <Stack direction="column" gap={6}>
        {/* Header della pagina */}
        <Box>
          <Heading mb={2} fontSize={{ base: 'lg', md: 'xl' }}>
            {settings.title}
          </Heading>
        </Box>

        {/* Sezione Informazioni Server */}
        <ServerInfoSection settings={s} loading={!s && !err} error={err} />

        {/* Sezione Interfaccia Utente */}
        <UserInterfaceSection />

        {/* Sezione Avanzate (solo per owner) */}
        <AdvancedSection
          envConfig={envConfig}
          envError={envErr}
          envLoading={envLoading}
          onEnvConfigSave={handleEnvConfigSave}
        />
      </Stack>
    </Box>
  )
}
