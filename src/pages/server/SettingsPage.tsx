import { useEffect, useState, type ChangeEvent, type JSX } from 'react'

import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Kbd,
  NativeSelect,
  RadioGroup,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'

import { useThemeMode, type ThemeMode } from '@/entities/user/ThemeModeContext'
import { EnvironmentConfigForm } from '@/features/environment-config'
import { BackgroundRotationSettings } from '@/shared/components/BackgroundRotationSettings'
import { BackgroundUpload } from '@/shared/components/BackgroundUpload'
import { ButtonsConfigForm } from '@/shared/components/ButtonsConfigForm'
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
  const { settings } = useLanguage()
  const theme = useThemeMode()
  const { isOwner } = useUiSettings()
  const queryClient = useQueryClient()
  const [s, setS] = useState<Settings | null>(null)
  const [envConfig, setEnvConfig] = useState<EnvironmentConfig | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [envErr, setEnvErr] = useState<string | null>(null)
  const [envLoading, setEnvLoading] = useState(false)
  const [meta, setMeta] = useState<{
    mode: string | null
    loader: string | null
    loaderVersion: string | null
    mcVersion: string | null
  } | null>(null)
  const [metaErr, setMetaErr] = useState<string | null>(null)
  const [metaSaving, setMetaSaving] = useState(false)
  const [metaSaved, setMetaSaved] = useState<'ok' | 'err' | null>(null)

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

  useEffect(() => {
    if (!isOwner) return
    const loadMeta = async () => {
      try {
        const token = localStorage.getItem('token')
        const r = await fetch('/api/settings/modpack-meta', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!r.ok) throw new Error('Failed to load modpack meta')
        const data = await r.json()
        setMeta({
          mode: (data.mode ?? null) as string | null,
          loader: (data.loader ?? null) as string | null,
          loaderVersion: (data.loaderVersion ?? null) as string | null,
          mcVersion: (data.mcVersion ?? null) as string | null,
        })
      } catch (e) {
        setMetaErr((e as Error).message)
      }
    }
    void loadMeta()
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

  const saveMeta = async () => {
    if (!isOwner || !meta) return
    try {
      setMetaSaving(true)
      const token = localStorage.getItem('token')
      const body = {
        mode: meta.mode || null,
        loader: meta.loader || null,
        loaderVersion: meta.loaderVersion || null,
        mcVersion: meta.mcVersion || null,
      }
      const r = await fetch('/api/settings/modpack-meta', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })
      if (!r.ok) throw new Error('Failed to save modpack meta')
      setMetaSaved('ok')
      // Invalida/refresh info mostrate altrove
      try {
        void queryClient.invalidateQueries({ queryKey: ['modpack', 'info'] })
        void queryClient.invalidateQueries({ queryKey: ['buttonsSettings'] })
      } catch {}
      // Ricarica il meta per riflettere eventuali normalizzazioni lato server
      try {
        const r2 = await fetch('/api/settings/modpack-meta', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (r2.ok) {
          const data = await r2.json()
          setMeta({
            mode: (data.mode ?? null) as string | null,
            loader: (data.loader ?? null) as string | null,
            loaderVersion: (data.loaderVersion ?? null) as string | null,
            mcVersion: (data.mcVersion ?? null) as string | null,
          })
        }
      } catch {}
    } catch (e) {
      setMetaErr((e as Error).message)
      setMetaSaved('err')
    } finally {
      setMetaSaving(false)
    }
  }

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Heading mb={4} fontSize={{ base: 'md', md: 'lg' }}>
        {settings.title}
      </Heading>

      {/* Current Settings View */}
      {err && (
        <Text color="accent.danger" fontSize={{ base: 'sm', md: 'md' }}>
          {settings.errorLoad}: {err}
        </Text>
      )}
      {!s && !err && <Text fontSize={{ base: 'sm', md: 'md' }}>{settings.loading}</Text>}
      {s && (
        <GlassCard
          inset
          as="dl"
          display="grid"
          gap={3}
          gridTemplateColumns={{ base: '1fr', sm: 'max-content 1fr' }}
          mb={6}
          p={{ base: 3, md: 4 }}
        >
          <Text as="dt" color="textMuted" fontSize={{ base: 'sm', md: 'md' }}>
            JAVA_BIN
          </Text>
          <Text as="dd" fontSize={{ base: 'sm', md: 'md' }} wordBreak="break-all">
            {s.javaBin}
          </Text>

          <Text as="dt" color="textMuted" fontSize={{ base: 'sm', md: 'md' }}>
            MC_DIR
          </Text>
          <Text as="dd" fontSize={{ base: 'sm', md: 'md' }} wordBreak="break-all">
            {s.mcDir}
          </Text>

          <Text as="dt" color="textMuted" fontSize={{ base: 'sm', md: 'md' }}>
            BACKUP_DIR
          </Text>
          <Text as="dd" fontSize={{ base: 'sm', md: 'md' }} wordBreak="break-all">
            {s.backupDir}
          </Text>

          <Text as="dt" color="textMuted" fontSize={{ base: 'sm', md: 'md' }}>
            RCON
          </Text>
          <Text as="dd" fontSize={{ base: 'sm', md: 'md' }}>
            {s.rcon.enabled ? `${s.rcon.host}:${s.rcon.port}` : 'disabled'}
          </Text>

          <Text as="dt" color="textMuted" fontSize={{ base: 'sm', md: 'md' }}>
            BACKUP_CRON
          </Text>
          <Text as="dd" fontSize={{ base: 'sm', md: 'md' }}>
            {s.backupCron}
          </Text>

          <Text as="dt" color="textMuted" fontSize={{ base: 'sm', md: 'md' }}>
            RETENTION
          </Text>
          <Text as="dd" fontSize={{ base: 'sm', md: 'md' }}>
            {s.retentionDays} days, {s.retentionWeeks} weeks
          </Text>
        </GlassCard>
      )}

      {/* Environment Configuration Form - Solo per owner */}
      {isOwner && (
        <Box mb={6}>
          {envErr && (
            <Text color="accent.danger" fontSize={{ base: 'sm', md: 'md' }} mb={4}>
              Errore caricamento configurazioni: {envErr}
            </Text>
          )}
          {envConfig && (
            <EnvironmentConfigForm
              initialConfig={envConfig}
              onSave={handleEnvConfigSave}
              loading={envLoading}
            />
          )}
        </Box>
      )}

      {/* Buttons Configuration Form - Solo per owner */}
      {isOwner && envConfig && (
        <Box mb={6}>
          <ButtonsConfigForm
            initialConfig={{
              launcherBtnVisible: envConfig.launcherBtnVisible,
              launcherBtnPath: envConfig.launcherBtnPath,
              configBtnVisible: envConfig.configBtnVisible,
              configBtnPath: envConfig.configBtnPath,
            }}
            onSave={handleEnvConfigSave}
            loading={envLoading}
          />
        </Box>
      )}

      {/* Background Upload - Solo per owner */}
      {isOwner && (
        <Box mb={6}>
          <BackgroundUpload />
        </Box>
      )}

      {isOwner && (
        <Box mb={6}>
          <BackgroundRotationSettings />
        </Box>
      )}

      {/* SFTP Section */}
      <GlassCard inset p={{ base: 3, md: 4 }}>
        <Heading size={{ base: 'sm', md: 'md' }} mb={2}>
          {settings.sftp.title}
        </Heading>
        <Text mb={2} fontSize={{ base: 'sm', md: 'md' }}>
          {settings.sftp.description}
        </Text>
        <HStack gap={2} wrap="wrap">
          <Kbd fontSize={{ base: 'xs', md: 'sm' }}>{settings.sftp.ssh}</Kbd>
          <Text fontSize={{ base: 'sm', md: 'md' }}>{settings.sftp.user}</Text>
        </HStack>
      </GlassCard>

      {/* Theme Section */}
      <GlassCard inset mt={6} p={{ base: 3, md: 4 }}>
        <Heading size={{ base: 'sm', md: 'md' }} mb={3}>
          {settings.theme.title}
        </Heading>
        <Text mb={2} fontSize={{ base: 'sm', md: 'md' }}>
          {settings.theme.description}
        </Text>
        <RadioGroup.Root
          value={theme.mode}
          onValueChange={(details) => {
            const v = details.value ?? 'system'
            theme.setMode(v as ThemeMode)
          }}
        >
          <Stack direction={{ base: 'column', sm: 'row' }} gap={4}>
            <RadioGroup.Item value="system">
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator />
              <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                {settings.theme.system}
              </RadioGroup.ItemText>
            </RadioGroup.Item>
            <RadioGroup.Item value="dark">
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator />
              <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                {settings.theme.dark}
              </RadioGroup.ItemText>
            </RadioGroup.Item>
            <RadioGroup.Item value="light">
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator />
              <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                {settings.theme.light}
              </RadioGroup.ItemText>
            </RadioGroup.Item>
          </Stack>
        </RadioGroup.Root>
        <Text mt={2} color="textMuted" fontSize={{ base: 'sm', md: 'md' }}>
          {settings.theme.current.replace('{theme}', theme.resolved)}
        </Text>
      </GlassCard>

      {/* Modpack Meta Configuration - Solo per owner */}
      {isOwner && (
        <Box mb={6}>
          <GlassCard inset p={{ base: 3, md: 4 }}>
            <Heading size={{ base: 'sm', md: 'md' }} mb={3}>
              Modpack Meta (manuale)
            </Heading>
            {metaErr && (
              <Text color="accent.danger" fontSize={{ base: 'sm', md: 'md' }} mb={2}>
                {metaErr}
              </Text>
            )}
            {metaSaved === 'ok' && (
              <Text color="accent.success" fontSize={{ base: 'sm', md: 'md' }} mb={2}>
                Meta salvato correttamente
              </Text>
            )}
            <Stack gap={3} direction={{ base: 'column', md: 'row' }}>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={meta?.mode ?? ''}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setMeta((m) => ({
                      ...(m ?? { mode: null, loader: null, loaderVersion: null, mcVersion: null }),
                      mode: e.target.value || null,
                    }))
                  }
                >
                  <option value="">(nessuno)</option>
                  <option value="automatic">automatic</option>
                  <option value="manual">manual</option>
                </NativeSelect.Field>
              </NativeSelect.Root>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={meta?.loader ?? ''}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setMeta((m) => ({
                      ...(m ?? { mode: null, loader: null, loaderVersion: null, mcVersion: null }),
                      loader: e.target.value || null,
                    }))
                  }
                >
                  <option value="">(loader)</option>
                  <option value="Vanilla">Vanilla</option>
                  <option value="Fabric">Fabric</option>
                  <option value="Forge">Forge</option>
                  <option value="NeoForge">NeoForge</option>
                  <option value="Quilt">Quilt</option>
                </NativeSelect.Field>
              </NativeSelect.Root>
              <Input
                placeholder="loaderVersion (es. 21.1.95)"
                value={meta?.loaderVersion ?? ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setMeta((m) => ({
                    ...(m ?? { mode: null, loader: null, loaderVersion: null, mcVersion: null }),
                    loaderVersion: e.target.value || null,
                  }))
                }
              />
              <Input
                placeholder="mcVersion (es. 1.21.1)"
                value={meta?.mcVersion ?? ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setMeta((m) => ({
                    ...(m ?? { mode: null, loader: null, loaderVersion: null, mcVersion: null }),
                    mcVersion: e.target.value || null,
                  }))
                }
              />
              <Button onClick={saveMeta} loading={metaSaving} disabled={metaSaving}>
                Salva
              </Button>
            </Stack>
            <Text mt={2} color="textMuted" fontSize={{ base: 'xs', md: 'sm' }}>
              Suggerimento: lascia vuoti i campi per eliminarli dal DB.
            </Text>
          </GlassCard>
        </Box>
      )}
    </Box>
  )
}
