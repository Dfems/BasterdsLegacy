import { useState, type JSX } from 'react'

import { Box, HStack, Heading, Input, Stack, Text } from '@chakra-ui/react'
import { Checkbox } from '@chakra-ui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import useLanguage from '@/shared/hooks/useLanguage'

type ButtonsConfig = {
  launcherBtnVisible: boolean
  launcherBtnPath: string
  configBtnVisible: boolean
  configBtnPath: string
  currentModpack: string
  currentVersion: string
}

type ButtonsConfigFormProps = {
  initialConfig: ButtonsConfig
  onSave: (changes: Partial<ButtonsConfig>) => Promise<void>
  loading: boolean
}

export const ButtonsConfigForm = ({
  initialConfig,
  onSave,
  loading,
}: ButtonsConfigFormProps): JSX.Element => {
  const { settings } = useLanguage()
  const queryClient = useQueryClient()

  const [config, setConfig] = useState<ButtonsConfig>(initialConfig)
  const [hasChanges, setHasChanges] = useState(false)

  const updateMutation = useMutation({
    mutationFn: onSave,
    onSuccess: () => {
      setHasChanges(false)
      // Invalida le query dei pulsanti per aggiornare l'UI
      void queryClient.invalidateQueries({ queryKey: ['buttonsSettings'] })
    },
  })

  const handleChange = (key: keyof ButtonsConfig, value: string | boolean): void => {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = (): void => {
    const changes: Partial<ButtonsConfig> = {}

    // Confronta con la configurazione iniziale e includi solo i cambiamenti
    if (config.launcherBtnVisible !== initialConfig.launcherBtnVisible) {
      changes.launcherBtnVisible = config.launcherBtnVisible
    }
    if (config.launcherBtnPath !== initialConfig.launcherBtnPath) {
      changes.launcherBtnPath = config.launcherBtnPath
    }
    if (config.configBtnVisible !== initialConfig.configBtnVisible) {
      changes.configBtnVisible = config.configBtnVisible
    }
    if (config.configBtnPath !== initialConfig.configBtnPath) {
      changes.configBtnPath = config.configBtnPath
    }
    if (config.currentModpack !== initialConfig.currentModpack) {
      changes.currentModpack = config.currentModpack
    }
    if (config.currentVersion !== initialConfig.currentVersion) {
      changes.currentVersion = config.currentVersion
    }

    updateMutation.mutate(changes)
  }

  return (
    <GlassCard inset p={{ base: 4, md: 5 }}>
      <Heading size={{ base: 'sm', md: 'md' }} mb={3}>
        Configurazione Pulsanti Download
      </Heading>
      <Text mb={4} fontSize={{ base: 'sm', md: 'md' }} color="textMuted">
        Configura la visibilità e i percorsi dei pulsanti di download
      </Text>

      <Stack gap={6}>
        {/* Configurazione Launcher */}
        <Box>
          <Heading size={{ base: 'xs', md: 'sm' }} mb={3}>
            CurseForge Launcher
          </Heading>
          <Stack gap={3}>
            <Checkbox.Root
              checked={config.launcherBtnVisible}
              onCheckedChange={(details) =>
                handleChange('launcherBtnVisible', details.checked === true)
              }
            >
              <Checkbox.HiddenInput />
              <Checkbox.Indicator />
              <Checkbox.Label>Mostra pulsante launcher</Checkbox.Label>
            </Checkbox.Root>
            <Box>
              <Text fontSize={{ base: 'sm', md: 'md' }} mb={2}>
                Percorso file launcher
              </Text>
              <Input
                value={config.launcherBtnPath}
                onChange={(e) => handleChange('launcherBtnPath', e.target.value)}
                placeholder="dfemscraft-launcher.jar"
                size={{ base: 'sm', md: 'md' }}
              />
            </Box>
          </Stack>
        </Box>

        {/* Configurazione Config */}
        <Box>
          <Heading size={{ base: 'xs', md: 'sm' }} mb={3}>
            Mods to install
          </Heading>
          <Stack gap={3}>
            <Checkbox.Root
              checked={config.configBtnVisible}
              onCheckedChange={(details) =>
                handleChange('configBtnVisible', details.checked === true)
              }
            >
              <Checkbox.HiddenInput />
              <Checkbox.Indicator />
              <Checkbox.Label>Mostra pulsante configurazione</Checkbox.Label>
            </Checkbox.Root>
            <Box>
              <Text fontSize={{ base: 'sm', md: 'md' }} mb={2}>
                Percorso file configurazione
              </Text>
              <Input
                value={config.configBtnPath}
                onChange={(e) => handleChange('configBtnPath', e.target.value)}
                placeholder="dfemscraft-config.zip"
                size={{ base: 'sm', md: 'md' }}
              />
            </Box>
          </Stack>
        </Box>

        {/* Configurazione Modpack corrente */}
        <Box>
          <Heading size={{ base: 'xs', md: 'sm' }} mb={3}>
            Modpack Corrente
          </Heading>
          <Stack gap={3}>
            <Box>
              <Text fontSize={{ base: 'sm', md: 'md' }} mb={2}>
                Nome Modpack
              </Text>
              <Input
                value={config.currentModpack}
                onChange={(e) => handleChange('currentModpack', e.target.value)}
                placeholder="Basterd's Legacy"
                size={{ base: 'sm', md: 'md' }}
              />
            </Box>
            <Box>
              <Text fontSize={{ base: 'sm', md: 'md' }} mb={2}>
                Versione
              </Text>
              <Input
                value={config.currentVersion}
                onChange={(e) => handleChange('currentVersion', e.target.value)}
                placeholder="1.0.0"
                size={{ base: 'sm', md: 'md' }}
              />
            </Box>
          </Stack>
        </Box>

        {/* Pulsanti azione */}
        <HStack gap={3} justify="flex-end">
          <GlassButton
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            loading={updateMutation.isPending || loading}
            size={{ base: 'sm', md: 'md' }}
          >
            {settings.save ?? 'Salva'}
          </GlassButton>
        </HStack>

        {updateMutation.isError && (
          <Text color="accent.danger" fontSize={{ base: 'sm', md: 'md' }}>
            Errore nel salvataggio: {(updateMutation.error as Error).message}
          </Text>
        )}

        {updateMutation.isSuccess && (
          <Text color="accent.success" fontSize={{ base: 'sm', md: 'md' }}>
            Configurazioni aggiornate con successo
          </Text>
        )}
      </Stack>
    </GlassCard>
  )
}
