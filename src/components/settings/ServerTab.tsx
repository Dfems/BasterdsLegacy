import { useState, type ChangeEvent, type JSX } from 'react'

import { Box, Button, HStack, Input, NativeSelect, Stack, Text, VStack } from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'

import { ButtonsConfigForm } from '@/shared/components/ButtonsConfigForm'
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

type ServerTabProps = {
  envConfig: EnvironmentConfig | null
  envLoading: boolean
  onSave: (config: Partial<EnvironmentConfig>) => Promise<void>
  isOwner: boolean
}

export const ServerTab = ({
  envConfig,
  envLoading,
  onSave,
  isOwner,
}: ServerTabProps): JSX.Element => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [meta, setMeta] = useState<{
    mode: string | null
    loader: string | null
    loaderVersion: string | null
    mcVersion: string | null
  } | null>(null)
  const [metaErr, setMetaErr] = useState<string | null>(null)
  const [metaSaving, setMetaSaving] = useState(false)
  const [metaSaved, setMetaSaved] = useState<'ok' | 'err' | null>(null)

  const saveMeta = async (): Promise<void> => {
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
      if (!r.ok) throw new Error(t.common.error)
      setMetaSaved('ok')

      try {
        void queryClient.invalidateQueries({ queryKey: ['modpack', 'info'] })
        void queryClient.invalidateQueries({ queryKey: ['buttonsSettings'] })
      } catch {}

      setTimeout(() => setMetaSaved(null), 3000)
    } catch (e) {
      setMetaErr((e as Error).message)
      setMetaSaved('err')
      setTimeout(() => setMetaSaved(null), 5000)
    } finally {
      setMetaSaving(false)
    }
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Hero Card */}
      <GlassCard
        inset
        bgGradient="linear(135deg, green.100/10, teal.300/5)"
        borderColor="green.200"
        p={8}
      >
        <VStack gap={4} textAlign="center">
          <Text fontSize="3xl">🖥️</Text>
          <Text fontSize="xl" fontWeight="bold" color="green.fg">
            {t.settings.tabs.server.title}
          </Text>
          <Text color="textMuted" maxW="md">
            {t.settings.tabs.server.description}
          </Text>
        </VStack>
      </GlassCard>

      {/* Buttons Configuration - Solo per owner */}
      {isOwner && envConfig && (
        <GlassCard inset p={6}>
          <HStack gap={4} align="start">
            <Text fontSize="2xl">🔘</Text>
            <Box flex={1}>
              <Text fontWeight="semibold" mb={2} fontSize="lg">
                {t.settings.buttons.title}
              </Text>
              <Text color="textMuted" fontSize="sm" mb={4}>
                {t.settings.buttons.description}
              </Text>
              <ButtonsConfigForm
                initialConfig={{
                  launcherBtnVisible: envConfig.launcherBtnVisible,
                  launcherBtnPath: envConfig.launcherBtnPath,
                  configBtnVisible: envConfig.configBtnVisible,
                  configBtnPath: envConfig.configBtnPath,
                }}
                onSave={onSave}
                loading={envLoading}
              />
            </Box>
          </HStack>
        </GlassCard>
      )}

      {/* Modpack Meta Configuration - Solo per owner */}
      {isOwner && (
        <GlassCard inset p={6}>
          <HStack gap={4} align="start">
            <Text fontSize="2xl">📦</Text>
            <Box flex={1}>
              <Text fontWeight="semibold" mb={2} fontSize="lg">
                {t.modpack.metaConfigTitle}
              </Text>
              <Text color="textMuted" fontSize="sm" mb={4}>
                {t.modpack.metaConfigDescription}
              </Text>

              {metaErr && (
                <Text color="red.500" fontSize="sm" mb={4}>
                  {metaErr}
                </Text>
              )}

              {metaSaved === 'ok' && (
                <Text color="green.500" fontSize="sm" mb={4}>
                  {t.modpack.metaSavedOk ?? t.common.success}
                </Text>
              )}

              <Stack gap={4} direction={{ base: 'column', md: 'row' }}>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={meta?.mode ?? ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setMeta((m) => ({
                        ...(m ?? {
                          mode: null,
                          loader: null,
                          loaderVersion: null,
                          mcVersion: null,
                        }),
                        mode: e.target.value || null,
                      }))
                    }
                  >
                    <option value="">(—)</option>
                    <option value="automatic">{t.modpack.automatic}</option>
                    <option value="manual">{t.modpack.manual}</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>

                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={meta?.loader ?? ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setMeta((m) => ({
                        ...(m ?? {
                          mode: null,
                          loader: null,
                          loaderVersion: null,
                          mcVersion: null,
                        }),
                        loader: e.target.value || null,
                      }))
                    }
                  >
                    <option value="">{t.common.loader}</option>
                    <option value="Vanilla">Vanilla</option>
                    <option value="Fabric">Fabric</option>
                    <option value="Forge">Forge</option>
                    <option value="NeoForge">NeoForge</option>
                    <option value="Quilt">Quilt</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>

                <Input
                  placeholder={t.modpack.loaderVersionPlaceholder}
                  value={meta?.loaderVersion ?? ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setMeta((m) => ({
                      ...(m ?? { mode: null, loader: null, loaderVersion: null, mcVersion: null }),
                      loaderVersion: e.target.value || null,
                    }))
                  }
                />

                <Input
                  placeholder={t.modpack.mcVersionPlaceholder}
                  value={meta?.mcVersion ?? ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setMeta((m) => ({
                      ...(m ?? { mode: null, loader: null, loaderVersion: null, mcVersion: null }),
                      mcVersion: e.target.value || null,
                    }))
                  }
                />

                <Button onClick={saveMeta} loading={metaSaving} disabled={metaSaving}>
                  {t.common.save}
                </Button>
              </Stack>

              <Text mt={3} color="textMuted" fontSize="xs">
                {t.modpack.metaHint ?? ''}
              </Text>
            </Box>
          </HStack>
        </GlassCard>
      )}

      {/* Access Restriction for non-owners */}
      {!isOwner && (
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
      )}
    </VStack>
  )
}
