import { useEffect, useState, type JSX } from 'react'

import { Box, Checkbox, HStack, Heading, Input, Stack, Text } from '@chakra-ui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import useLanguage from '@/shared/hooks/useLanguage'

type EditableButtonsConfig = {
  launcherBtnVisible: boolean
  launcherBtnPath: string
  configBtnVisible: boolean
  configBtnPath: string
}

type ButtonsConfigFormProps = {
  initialConfig: EditableButtonsConfig
  onSave: (changes: Partial<EditableButtonsConfig>) => Promise<void>
  loading: boolean
}

export const ButtonsConfigForm = ({
  initialConfig,
  onSave,
  loading,
}: ButtonsConfigFormProps): JSX.Element => {
  const { settings, common } = useLanguage()
  const queryClient = useQueryClient()

  const [config, setConfig] = useState<EditableButtonsConfig>(initialConfig)
  const [hasChanges, setHasChanges] = useState(false)
  const [modpackInfo, setModpackInfo] = useState<{ name: string; version: string } | null>(null)

  const updateMutation = useMutation({
    mutationFn: onSave,
    onSuccess: () => {
      setHasChanges(false)
      // Invalida le query dei pulsanti per aggiornare l'UI
      void queryClient.invalidateQueries({ queryKey: ['buttonsSettings'] })
    },
  })

  const handleChange = (key: keyof EditableButtonsConfig, value: string | boolean): void => {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = (): void => {
    const changes: Partial<EditableButtonsConfig> = {}

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
    updateMutation.mutate(changes)
  }

  // Carica info modpack correnti dal backend pubblico
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/settings/buttons')
        if (!res.ok) return
        const data = (await res.json()) as { modpack?: { name?: string; version?: string } }
        if (data.modpack)
          setModpackInfo({ name: data.modpack.name ?? '', version: data.modpack.version ?? '' })
      } catch {
        // ignora errori di rete
      }
    }
    void run()
  }, [])

  return (
    <GlassCard inset p={{ base: 4, md: 5 }}>
      <Heading size={{ base: 'sm', md: 'md' }} mb={3}>
        {settings.buttons?.title ?? 'Configurazione Pulsanti Download'}
      </Heading>
      <Text mb={4} fontSize={{ base: 'sm', md: 'md' }} color="textMuted">
        {settings.buttons?.description ??
          'Configura la visibilità e i percorsi dei pulsanti di download'}
      </Text>

      <Stack gap={6}>
        {/* Configurazione Launcher */}
        <Box>
          <Heading size={{ base: 'xs', md: 'sm' }} mb={3}>
            {settings.buttons?.launcher.title ?? 'CurseForge Launcher'}
          </Heading>
          <Stack gap={3}>
            <Checkbox.Root
              size="sm"
              checked={config.launcherBtnVisible}
              onCheckedChange={(details) =>
                handleChange('launcherBtnVisible', details.checked === true)
              }
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>
                {settings.buttons?.launcher.visible ?? 'Mostra pulsante launcher'}
              </Checkbox.Label>
            </Checkbox.Root>
            <Box>
              <Text fontSize={{ base: 'sm', md: 'md' }} mb={2}>
                {settings.buttons?.launcher.path.label ?? 'Percorso file launcher'}
              </Text>
              <Input
                value={config.launcherBtnPath}
                onChange={(e) => handleChange('launcherBtnPath', e.target.value)}
                placeholder={
                  settings.buttons?.launcher.path.placeholder ?? 'dfemscraft-launcher.jar'
                }
                size={{ base: 'sm', md: 'md' }}
              />
            </Box>
          </Stack>
        </Box>

        {/* Configurazione Config */}
        <Box>
          <Heading size={{ base: 'xs', md: 'sm' }} mb={3}>
            {settings.buttons?.config.title ?? 'Mods to install'}
          </Heading>
          <Stack gap={3}>
            <Checkbox.Root
              size="sm"
              checked={config.configBtnVisible}
              onCheckedChange={(details) =>
                handleChange('configBtnVisible', details.checked === true)
              }
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>
                {settings.buttons?.config.visible ?? 'Mostra pulsante configurazione'}
              </Checkbox.Label>
            </Checkbox.Root>
            <Box>
              <Text fontSize={{ base: 'sm', md: 'md' }} mb={2}>
                {settings.buttons?.config.path.label ?? 'Percorso file configurazione'}
              </Text>
              <Input
                value={config.configBtnPath}
                onChange={(e) => handleChange('configBtnPath', e.target.value)}
                placeholder={settings.buttons?.config.path.placeholder ?? 'dfemscraft-config.zip'}
                size={{ base: 'sm', md: 'md' }}
              />
            </Box>
          </Stack>
        </Box>

        {/* Configurazione Modpack corrente */}
        <Box>
          <Heading size={{ base: 'xs', md: 'sm' }} mb={3}>
            {settings.buttons?.modpack.title ?? 'Modpack Corrente'}
          </Heading>
          <Stack gap={3}>
            <Box>
              <Text fontSize={{ base: 'sm', md: 'md' }} mb={2}>
                {settings.buttons?.modpack.name.label ?? 'Nome Modpack'}
              </Text>
              <Input
                value={modpackInfo?.name ?? ''}
                readOnly
                placeholder={settings.buttons?.modpack.name.placeholder ?? "Basterd's Legacy"}
                size={{ base: 'sm', md: 'md' }}
              />
            </Box>
            <Box>
              <Text fontSize={{ base: 'sm', md: 'md' }} mb={2}>
                {settings.buttons?.modpack.version.label ?? 'Versione'}
              </Text>
              <Input
                value={modpackInfo?.version ?? ''}
                readOnly
                placeholder={settings.buttons?.modpack.version.placeholder ?? '1.0.0'}
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
            {(common?.error ?? 'Errore') + ': '}
            {(updateMutation.error as Error).message}
          </Text>
        )}

        {updateMutation.isSuccess && (
          <Text color="accent.success" fontSize={{ base: 'sm', md: 'md' }}>
            {common?.success ?? 'Successo'}
          </Text>
        )}
      </Stack>
    </GlassCard>
  )
}
