import { useState, type JSX } from 'react'

import { Alert, Box, Button, Field, Heading, Input, Stack, Text } from '@chakra-ui/react'

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
  // Configurazioni logging
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  logLevels?: ('trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'all')[]
  logDir: string
  logFileEnabled: boolean
  logRetentionDays: number
  logMaxFiles: number
}

type InternalEnvironmentConfig = EnvironmentConfig & {
  logLevels: ('trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'all')[]
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
  const { settings, common } = useLanguage()

  // Gestione retrocompatibilità per logLevels
  const normalizedInitialConfig: InternalEnvironmentConfig = {
    ...initialConfig,
    logLevels: initialConfig.logLevels || [initialConfig.logLevel || 'info'],
  }

  const [config, setConfig] = useState<InternalEnvironmentConfig>(normalizedInitialConfig)
  const [submitting, setSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null)
  const [saveMessage, setSaveMessage] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setSaveStatus(null)
    setSaveMessage('')

    try {
      // Solo invia i campi che sono cambiati
      const changes: Partial<EnvironmentConfig> = {}

      if (config.javaBin !== normalizedInitialConfig.javaBin) changes.javaBin = config.javaBin
      if (config.mcDir !== normalizedInitialConfig.mcDir) changes.mcDir = config.mcDir
      if (config.backupDir !== normalizedInitialConfig.backupDir)
        changes.backupDir = config.backupDir
      if (config.rconEnabled !== normalizedInitialConfig.rconEnabled)
        changes.rconEnabled = config.rconEnabled
      if (config.rconHost !== normalizedInitialConfig.rconHost) changes.rconHost = config.rconHost
      if (config.rconPort !== normalizedInitialConfig.rconPort) changes.rconPort = config.rconPort
      if (config.rconPass !== normalizedInitialConfig.rconPass) changes.rconPass = config.rconPass
      // Configurazioni logging
      if (config.logLevel !== normalizedInitialConfig.logLevel) changes.logLevel = config.logLevel
      if (JSON.stringify(config.logLevels) !== JSON.stringify(normalizedInitialConfig.logLevels))
        changes.logLevels = config.logLevels
      if (config.logDir !== normalizedInitialConfig.logDir) changes.logDir = config.logDir
      if (config.logFileEnabled !== normalizedInitialConfig.logFileEnabled)
        changes.logFileEnabled = config.logFileEnabled
      if (config.logRetentionDays !== normalizedInitialConfig.logRetentionDays)
        changes.logRetentionDays = config.logRetentionDays
      if (config.logMaxFiles !== normalizedInitialConfig.logMaxFiles)
        changes.logMaxFiles = config.logMaxFiles

      await onSave(changes)

      // Mostra messaggio di successo
      setSaveStatus('success')
      setSaveMessage(settings.environment.success)

      // Nascondi il messaggio dopo 3 secondi
      setTimeout(() => {
        setSaveStatus(null)
        setSaveMessage('')
      }, 3000)
    } catch (error) {
      // Mostra messaggio di errore
      setSaveStatus('error')
      setSaveMessage((error as Error).message || settings.environment.error)

      // Nascondi il messaggio di errore dopo 5 secondi
      setTimeout(() => {
        setSaveStatus(null)
        setSaveMessage('')
      }, 5000)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = (): void => {
    setConfig(normalizedInitialConfig)
    setSaveStatus(null)
    setSaveMessage('')
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

      {/* Save Status Alert */}
      {saveStatus && saveMessage && (
        <Alert.Root
          status={saveStatus === 'success' ? 'success' : 'error'}
          mb={4}
          fontSize={{ base: 'sm', md: 'md' }}
        >
          <Alert.Indicator />
          <Alert.Title>{saveStatus === 'success' ? common.success : common.error}</Alert.Title>
          <Alert.Description>{saveMessage}</Alert.Description>
        </Alert.Root>
      )}

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

          {/* Logging Configuration */}
          <Box>
            <Heading size={{ base: 'xs', md: 'sm' }} mb={3}>
              {settings.environment.logging.title}
            </Heading>
            <Text color="textMuted" fontSize={{ base: 'xs', md: 'sm' }} mb={4}>
              {settings.environment.logging.description}
            </Text>
            <Stack gap={4}>
              <Field.Root>
                <label>
                  <input
                    type="checkbox"
                    checked={config.logFileEnabled}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, logFileEnabled: e.target.checked }))
                    }
                  />
                  <Text as="span" ml={2} fontSize={{ base: 'sm', md: 'md' }}>
                    {settings.environment.logging.fileEnabled.label}
                  </Text>
                </label>
                <Field.HelperText fontSize={{ base: 'xs', md: 'sm' }}>
                  {settings.environment.logging.fileEnabled.description}
                </Field.HelperText>
              </Field.Root>

              {config.logFileEnabled && (
                <>
                  <Field.Root>
                    <Field.Label fontSize={{ base: 'sm', md: 'md' }}>
                      {settings.environment.logging.levels.label}
                    </Field.Label>
                    <Field.HelperText fontSize={{ base: 'xs', md: 'sm' }}>
                      {settings.environment.logging.levels.description}
                    </Field.HelperText>
                    <Stack gap={2} mt={2}>
                      {/* Opzione ALL */}
                      <label style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={config.logLevels.includes('all')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Se selezionato ALL, deseleziona tutto e seleziona solo ALL
                              setConfig((prev) => ({ ...prev, logLevels: ['all'] }))
                            } else {
                              // Se deselezionato ALL, mantieni info come default
                              setConfig((prev) => ({ ...prev, logLevels: ['info'] }))
                            }
                          }}
                          style={{ marginRight: '8px' }}
                        />
                        <Text fontSize={{ base: 'sm', md: 'md' }}>
                          <strong>{settings.environment.logging.levels.all}</strong>
                        </Text>
                      </label>

                      {/* Singoli levels */}
                      {(['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const).map(
                        (level) => (
                          <label key={level} style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                              type="checkbox"
                              checked={
                                config.logLevels.includes(level) &&
                                !config.logLevels.includes('all')
                              }
                              disabled={config.logLevels.includes('all')}
                              onChange={(e) => {
                                setConfig((prev) => {
                                  const newLevels = [...prev.logLevels.filter((l) => l !== 'all')]
                                  if (e.target.checked) {
                                    if (!newLevels.includes(level)) {
                                      newLevels.push(level)
                                    }
                                  } else {
                                    const index = newLevels.indexOf(level)
                                    if (index > -1) {
                                      newLevels.splice(index, 1)
                                    }
                                  }
                                  // Se non ci sono levels selezionati, mantieni almeno info
                                  return {
                                    ...prev,
                                    logLevels: newLevels.length > 0 ? newLevels : ['info'],
                                  }
                                })
                              }}
                              style={{ marginRight: '8px' }}
                            />
                            <Text
                              fontSize={{ base: 'sm', md: 'md' }}
                              color={config.logLevels.includes('all') ? 'gray.500' : 'inherit'}
                            >
                              {settings.environment.logging.levels[level]}
                            </Text>
                          </label>
                        )
                      )}
                    </Stack>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label fontSize={{ base: 'sm', md: 'md' }}>
                      {settings.environment.logging.dir.label}
                    </Field.Label>
                    <Field.HelperText fontSize={{ base: 'xs', md: 'sm' }}>
                      {settings.environment.logging.dir.description}
                    </Field.HelperText>
                    <Input
                      value={config.logDir}
                      onChange={(e) => setConfig((prev) => ({ ...prev, logDir: e.target.value }))}
                      placeholder={settings.environment.logging.dir.placeholder}
                      fontSize={{ base: 'sm', md: 'md' }}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label fontSize={{ base: 'sm', md: 'md' }}>
                      {settings.environment.logging.retentionDays.label}
                    </Field.Label>
                    <Field.HelperText fontSize={{ base: 'xs', md: 'sm' }}>
                      {settings.environment.logging.retentionDays.description}
                    </Field.HelperText>
                    <Input
                      type="number"
                      value={config.logRetentionDays.toString()}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, logRetentionDays: Number(e.target.value) }))
                      }
                      min={1}
                      max={365}
                      placeholder={settings.environment.logging.retentionDays.placeholder}
                      fontSize={{ base: 'sm', md: 'md' }}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label fontSize={{ base: 'sm', md: 'md' }}>
                      {settings.environment.logging.maxFiles.label}
                    </Field.Label>
                    <Field.HelperText fontSize={{ base: 'xs', md: 'sm' }}>
                      {settings.environment.logging.maxFiles.description}
                    </Field.HelperText>
                    <Input
                      type="number"
                      value={config.logMaxFiles.toString()}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, logMaxFiles: Number(e.target.value) }))
                      }
                      min={1}
                      max={100}
                      placeholder={settings.environment.logging.maxFiles.placeholder}
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
