import { useState, type JSX } from 'react'

import { Box, Button, Field, Heading, Input, RadioGroup, Stack, Text } from '@chakra-ui/react'

import { GlassCard } from '@/shared/components/GlassCard'

type EnvironmentConfig = {
  javaBin: string
  mcDir: string
  backupDir: string
  rconEnabled: boolean
  rconHost: string
  rconPort: number
  rconPass: string
  backupCron: string
  retentionDays: number
  retentionWeeks: number
  autoBackupEnabled: boolean
  autoBackupCron: string
  autoBackupMode: 'full' | 'world'
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
      if (config.backupCron !== initialConfig.backupCron) changes.backupCron = config.backupCron
      if (config.retentionDays !== initialConfig.retentionDays)
        changes.retentionDays = config.retentionDays
      if (config.retentionWeeks !== initialConfig.retentionWeeks)
        changes.retentionWeeks = config.retentionWeeks
      if (config.autoBackupEnabled !== initialConfig.autoBackupEnabled)
        changes.autoBackupEnabled = config.autoBackupEnabled
      if (config.autoBackupCron !== initialConfig.autoBackupCron)
        changes.autoBackupCron = config.autoBackupCron
      if (config.autoBackupMode !== initialConfig.autoBackupMode)
        changes.autoBackupMode = config.autoBackupMode

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
        <Text fontSize={{ base: 'sm', md: 'md' }}>Caricamento...</Text>
      </GlassCard>
    )
  }

  return (
    <GlassCard inset p={{ base: 4, md: 6 }}>
      <Heading size={{ base: 'sm', md: 'md' }} mb={4}>
        Configurazioni Ambiente
      </Heading>
      <Text color="textMuted" fontSize={{ base: 'sm', md: 'md' }} mb={6}>
        Configura le variabili d'ambiente del server (solo per proprietari)
      </Text>

      <Box as="form" onSubmit={handleSubmit}>
        <Stack gap={6}>
          {/* Java Configuration */}
          <Box>
            <Field.Root>
              <Field.Label fontSize={{ base: 'sm', md: 'md' }}>JAVA_BIN</Field.Label>
              <Field.HelperText fontSize={{ base: 'xs', md: 'sm' }}>
                Percorso dell'eseguibile Java
              </Field.HelperText>
              <Input
                value={config.javaBin}
                onChange={(e) => setConfig((prev) => ({ ...prev, javaBin: e.target.value }))}
                placeholder="java"
                fontSize={{ base: 'sm', md: 'md' }}
              />
            </Field.Root>
          </Box>

          {/* Directory Configuration */}
          <Stack gap={4}>
            <Field.Root>
              <Field.Label fontSize={{ base: 'sm', md: 'md' }}>MC_DIR</Field.Label>
              <Field.HelperText fontSize={{ base: 'xs', md: 'sm' }}>
                Directory del server Minecraft
              </Field.HelperText>
              <Input
                value={config.mcDir}
                onChange={(e) => setConfig((prev) => ({ ...prev, mcDir: e.target.value }))}
                placeholder="./server/runtime"
                fontSize={{ base: 'sm', md: 'md' }}
              />
            </Field.Root>

            <Field.Root>
              <Field.Label fontSize={{ base: 'sm', md: 'md' }}>BACKUP_DIR</Field.Label>
              <Field.HelperText fontSize={{ base: 'xs', md: 'sm' }}>
                Directory dei backup
              </Field.HelperText>
              <Input
                value={config.backupDir}
                onChange={(e) => setConfig((prev) => ({ ...prev, backupDir: e.target.value }))}
                placeholder="./server/runtime/backups"
                fontSize={{ base: 'sm', md: 'md' }}
              />
            </Field.Root>
          </Stack>

          {/* RCON Configuration */}
          <Box>
            <Heading size={{ base: 'xs', md: 'sm' }} mb={3}>
              Configurazione RCON
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
                    RCON Abilitato
                  </Text>
                </label>
              </Field.Root>

              {config.rconEnabled && (
                <>
                  <Field.Root>
                    <Field.Label fontSize={{ base: 'sm', md: 'md' }}>Host RCON</Field.Label>
                    <Input
                      value={config.rconHost}
                      onChange={(e) => setConfig((prev) => ({ ...prev, rconHost: e.target.value }))}
                      placeholder="127.0.0.1"
                      fontSize={{ base: 'sm', md: 'md' }}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label fontSize={{ base: 'sm', md: 'md' }}>Porta RCON</Field.Label>
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
                    <Field.Label fontSize={{ base: 'sm', md: 'md' }}>Password RCON</Field.Label>
                    <Field.HelperText fontSize={{ base: 'xs', md: 'sm' }}>
                      Lascia vuoto per generare automaticamente
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

          {/* Backup Configuration */}
          <Box>
            <Heading size={{ base: 'xs', md: 'sm' }} mb={3}>
              Configurazione Backup
            </Heading>
            <Stack gap={4}>
              <Field.Root>
                <Field.Label fontSize={{ base: 'sm', md: 'md' }}>
                  Schedule Backup (CRON)
                </Field.Label>
                <Field.HelperText fontSize={{ base: 'xs', md: 'sm' }}>
                  Formato: minuto ora giorno mese giornoSettimana
                </Field.HelperText>
                <Input
                  value={config.backupCron}
                  onChange={(e) => setConfig((prev) => ({ ...prev, backupCron: e.target.value }))}
                  placeholder="0 3 * * *"
                  fontSize={{ base: 'sm', md: 'md' }}
                />
              </Field.Root>

              <Stack direction={{ base: 'column', sm: 'row' }} gap={4}>
                <Field.Root>
                  <Field.Label fontSize={{ base: 'sm', md: 'md' }}>Giorni di retention</Field.Label>
                  <Input
                    type="number"
                    value={config.retentionDays.toString()}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, retentionDays: Number(e.target.value) }))
                    }
                    min={0}
                    fontSize={{ base: 'sm', md: 'md' }}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label fontSize={{ base: 'sm', md: 'md' }}>
                    Settimane di retention
                  </Field.Label>
                  <Input
                    type="number"
                    value={config.retentionWeeks.toString()}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, retentionWeeks: Number(e.target.value) }))
                    }
                    min={0}
                    fontSize={{ base: 'sm', md: 'md' }}
                  />
                </Field.Root>
              </Stack>
            </Stack>
          </Box>

          {/* Auto Backup Configuration */}
          <Box>
            <Heading size={{ base: 'xs', md: 'sm' }} mb={3}>
              Backup Automatici
            </Heading>
            <Stack gap={4}>
              <Field.Root>
                <label>
                  <input
                    type="checkbox"
                    checked={config.autoBackupEnabled}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, autoBackupEnabled: e.target.checked }))
                    }
                  />
                  <Text as="span" ml={2} fontSize={{ base: 'sm', md: 'md' }}>
                    Backup Automatici Abilitati
                  </Text>
                </label>
              </Field.Root>

              {config.autoBackupEnabled && (
                <>
                  <Field.Root>
                    <Field.Label fontSize={{ base: 'sm', md: 'md' }}>
                      Schedule Backup Automatici (CRON)
                    </Field.Label>
                    <Input
                      value={config.autoBackupCron}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, autoBackupCron: e.target.value }))
                      }
                      placeholder="0 3 * * *"
                      fontSize={{ base: 'sm', md: 'md' }}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label fontSize={{ base: 'sm', md: 'md' }}>Modalità Backup</Field.Label>
                    <RadioGroup.Root
                      value={config.autoBackupMode}
                      onValueChange={(details) =>
                        setConfig((prev) => ({
                          ...prev,
                          autoBackupMode: details.value as 'full' | 'world',
                        }))
                      }
                    >
                      <Stack direction={{ base: 'column', sm: 'row' }} gap={4}>
                        <RadioGroup.Item value="full">
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemIndicator />
                          <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                            Completo
                          </RadioGroup.ItemText>
                        </RadioGroup.Item>
                        <RadioGroup.Item value="world">
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemIndicator />
                          <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                            Solo Mondo
                          </RadioGroup.ItemText>
                        </RadioGroup.Item>
                      </Stack>
                    </RadioGroup.Root>
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
              Salva
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={submitting}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              Ripristina
            </Button>
          </Stack>
        </Stack>
      </Box>
    </GlassCard>
  )
}
