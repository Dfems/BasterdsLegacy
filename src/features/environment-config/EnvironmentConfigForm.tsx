import { useState, type JSX } from 'react'

import { Box, Button, Field, Heading, Input, Stack, Text } from '@chakra-ui/react'

import { GlassCard } from '@/shared/components/GlassCard'
import useLanguage from '@/shared/hooks/useLanguage'

type EnvironmentConfig = {
  javaBin: string
  mcDir: string
  backupDir: string
  rconEnabled: boolean
  rconHost: string
  rconPort: number
  rconPass: string
}

type EnvironmentConfigFormProps = {
  initialConfig: EnvironmentConfig
  onSave: (config: Partial<EnvironmentConfig>) => Promise<void>
  loading?: boolean
}

export const EnvironmentConfigForm = ({
  initialConfig,
  onSave,
  loading = false,
}: EnvironmentConfigFormProps): JSX.Element => {
  const { settings } = useLanguage()
  const [config, setConfig] = useState<EnvironmentConfig>(initialConfig)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    try {
      // Solo invia i campi che sono cambiati
      const changes: Partial<EnvironmentConfig> = {}

      if (config.javaBin !== initialConfig.javaBin) changes.javaBin = config.javaBin
      if (config.mcDir !== initialConfig.mcDir) changes.mcDir = config.mcDir
      if (config.backupDir !== initialConfig.backupDir) changes.backupDir = config.backupDir
      if (config.rconEnabled !== initialConfig.rconEnabled) changes.rconEnabled = config.rconEnabled
      if (config.rconHost !== initialConfig.rconHost) changes.rconHost = config.rconHost
      if (config.rconPort !== initialConfig.rconPort) changes.rconPort = config.rconPort
      if (config.rconPass !== initialConfig.rconPass) changes.rconPass = config.rconPass

      await onSave(changes)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = (): void => {
    setConfig(initialConfig)
  }

  if (loading) {
    return (
      <GlassCard inset p={{ base: 4, md: 6 }}>
        <Text fontSize={{ base: 'sm', md: 'md' }}>{settings.loading}</Text>
      </GlassCard>
    )
  }

  return (
    <GlassCard inset p={{ base: 4, md: 6 }}>
      <Heading size={{ base: 'sm', md: 'md' }} mb={4}>
        {settings.environment.title}
      </Heading>
      <Text color="textMuted" fontSize={{ base: 'sm', md: 'md' }} mb={6}>
        {settings.environment.description}
      </Text>

      <Box as="form" onSubmit={handleSubmit}>
        <Stack gap={6}>
          {/* Java Configuration */}
          <Box>
            <Field.Root>
              <Field.Label fontSize={{ base: 'sm', md: 'md' }}>
                {settings.environment.javaBin.label}
              </Field.Label>
              <Field.HelperText fontSize={{ base: 'xs', md: 'sm' }}>
                {settings.environment.javaBin.description}
              </Field.HelperText>
              <Input
                value={config.javaBin}
                onChange={(e) => setConfig((prev) => ({ ...prev, javaBin: e.target.value }))}
                placeholder={settings.environment.javaBin.placeholder}
                fontSize={{ base: 'sm', md: 'md' }}
              />
            </Field.Root>
          </Box>

          {/* Directory Configuration */}
          <Stack gap={4}>
            <Field.Root>
              <Field.Label fontSize={{ base: 'sm', md: 'md' }}>
                {settings.environment.mcDir.label}
              </Field.Label>
              <Field.HelperText fontSize={{ base: 'xs', md: 'sm' }}>
                {settings.environment.mcDir.description}
              </Field.HelperText>
              <Input
                value={config.mcDir}
                onChange={(e) => setConfig((prev) => ({ ...prev, mcDir: e.target.value }))}
                placeholder={settings.environment.mcDir.placeholder}
                fontSize={{ base: 'sm', md: 'md' }}
              />
            </Field.Root>

            <Field.Root>
              <Field.Label fontSize={{ base: 'sm', md: 'md' }}>
                {settings.environment.backupDir.label}
              </Field.Label>
              <Field.HelperText fontSize={{ base: 'xs', md: 'sm' }}>
                {settings.environment.backupDir.description}
              </Field.HelperText>
              <Input
                value={config.backupDir}
                onChange={(e) => setConfig((prev) => ({ ...prev, backupDir: e.target.value }))}
                placeholder={settings.environment.backupDir.placeholder}
                fontSize={{ base: 'sm', md: 'md' }}
              />
            </Field.Root>
          </Stack>

          {/* RCON Configuration */}
          <Box>
            <Heading size={{ base: 'xs', md: 'sm' }} mb={3}>
              {settings.environment.rcon.title}
            </Heading>
            <Stack gap={4}>
              <Field.Root>
                <label>
                  <input
                    type="checkbox"
                    checked={config.rconEnabled}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, rconEnabled: e.target.checked }))
                    }
                  />
                  <Text as="span" ml={2} fontSize={{ base: 'sm', md: 'md' }}>
                    {settings.environment.rcon.enabled}
                  </Text>
                </label>
              </Field.Root>

              {config.rconEnabled && (
                <>
                  <Field.Root>
                    <Field.Label fontSize={{ base: 'sm', md: 'md' }}>
                      {settings.environment.rcon.host.label}
                    </Field.Label>
                    <Input
                      value={config.rconHost}
                      onChange={(e) => setConfig((prev) => ({ ...prev, rconHost: e.target.value }))}
                      placeholder={settings.environment.rcon.host.placeholder}
                      fontSize={{ base: 'sm', md: 'md' }}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label fontSize={{ base: 'sm', md: 'md' }}>
                      {settings.environment.rcon.port.label}
                    </Field.Label>
                    <Input
                      type="number"
                      value={config.rconPort.toString()}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, rconPort: Number(e.target.value) }))
                      }
                      min={1}
                      max={65535}
                      fontSize={{ base: 'sm', md: 'md' }}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label fontSize={{ base: 'sm', md: 'md' }}>
                      {settings.environment.rcon.password.label}
                    </Field.Label>
                    <Field.HelperText fontSize={{ base: 'xs', md: 'sm' }}>
                      {settings.environment.rcon.password.placeholder}
                    </Field.HelperText>
                    <Input
                      type="password"
                      value={config.rconPass}
                      onChange={(e) => setConfig((prev) => ({ ...prev, rconPass: e.target.value }))}
                      fontSize={{ base: 'sm', md: 'md' }}
                    />
                  </Field.Root>
                </>
              )}
            </Stack>
          </Box>

          {/* Actions */}
          <Stack direction={{ base: 'column', sm: 'row' }} gap={4}>
            <Button
              type="submit"
              colorScheme="blue"
              loading={submitting}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {settings.save}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={submitting}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {settings.reset}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </GlassCard>
  )
}
