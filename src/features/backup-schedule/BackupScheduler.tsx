import { useEffect, useState, type JSX } from 'react'

import { Box, Heading, HStack, Input, RadioGroup, Stack, Text, VStack } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import { SimpleSelect } from '@/shared/components/SimpleSelect'
import useLanguage from '@/shared/hooks/useLanguage'

type BackupScheduleConfig = {
  enabled: boolean
  frequency: 'disabled' | 'daily' | 'every-2-days' | 'every-3-days' | 'weekly' | 'custom'
  mode: 'full' | 'world'
  cronPattern?: string
  dailyAt?: string
  weeklyOn?: number
  multipleDaily?: string[]
}

type ScheduleResponse = {
  config: BackupScheduleConfig
  presets: string[]
  nextRun?: string
  lastRun?: string
}

type Preset = {
  id: string
  name: string
  enabled: boolean
  frequency: string
  mode: 'full' | 'world'
  dailyAt?: string
  weeklyOn?: number
  multipleDaily?: string[]
}

export const BackupScheduler = (): JSX.Element => {
  const { backups } = useLanguage()
  const qc = useQueryClient()

  // Form state
  const [configType, setConfigType] = useState<'presets' | 'custom'>('presets')
  const [selectedPreset, setSelectedPreset] = useState<string>('disabled')
  const [customConfig, setCustomConfig] = useState<BackupScheduleConfig>({
    enabled: false,
    frequency: 'daily',
    mode: 'world',
    dailyAt: '03:00',
    weeklyOn: 1,
  })
  const [customCron, setCustomCron] = useState('')

  // Load current schedule
  const { data: scheduleData, isLoading } = useQuery<ScheduleResponse>({
    queryKey: ['backup-schedule'],
    queryFn: async () => {
      const r = await fetch('/api/backups/schedule')
      if (!r.ok) throw new Error('Errore nel caricamento della configurazione backup')
      return (await r.json()) as ScheduleResponse
    },
    staleTime: 10_000,
  })

  // Load presets
  const { data: presetsData } = useQuery<{ presets: Preset[] }>({
    queryKey: ['backup-presets'],
    queryFn: async () => {
      const r = await fetch('/api/backups/presets')
      if (!r.ok) throw new Error('Errore nel caricamento dei preset')
      return (await r.json()) as { presets: Preset[] }
    },
    staleTime: 60_000,
  })

  // Update schedule mutation
  const updateSchedule = useMutation({
    mutationFn: async (config: { preset?: string } | BackupScheduleConfig) => {
      const r = await fetch('/api/backups/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!r.ok) {
        const error = await r.text()
        throw new Error(error)
      }
      return r.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backup-schedule'] })
    },
  })

  // Initialize form with current config
  useEffect(() => {
    if (scheduleData?.config) {
      const config = scheduleData.config
      setCustomConfig(config)

      // Determine if this matches a preset
      const matchingPreset = presetsData?.presets.find(
        (preset) =>
          preset.enabled === config.enabled &&
          preset.frequency === config.frequency &&
          preset.mode === config.mode &&
          preset.dailyAt === config.dailyAt &&
          preset.weeklyOn === config.weeklyOn
      )

      if (matchingPreset) {
        setSelectedPreset(matchingPreset.id)
        setConfigType('presets')
      } else {
        setConfigType('custom')
      }
    }
  }, [scheduleData, presetsData])

  const handlePresetSubmit = (): void => {
    updateSchedule.mutate({ preset: selectedPreset })
  }

  const handleCustomSubmit = (): void => {
    const config: BackupScheduleConfig = { ...customConfig }

    if (config.frequency === 'custom' && customCron) {
      config.cronPattern = customCron
    }

    updateSchedule.mutate(config)
  }

  const presetOptions =
    presetsData?.presets.map((preset) => ({
      value: preset.id,
      label:
        backups.schedule.preset[preset.id as keyof typeof backups.schedule.preset] || preset.name,
    })) || []

  const frequencyOptions = [
    { value: 'daily', label: backups.schedule.frequency_options.daily },
    { value: 'every-2-days', label: backups.schedule.frequency_options.every_2_days },
    { value: 'every-3-days', label: backups.schedule.frequency_options.every_3_days },
    { value: 'weekly', label: backups.schedule.frequency_options.weekly },
    { value: 'custom', label: backups.schedule.frequency_options.custom },
  ]

  const dayOptions = Object.entries(backups.schedule.day_options).map(([value, label]) => ({
    value,
    label,
  }))

  if (isLoading) {
    return (
      <GlassCard p={{ base: 4, md: 6 }}>
        <Text>{backups.schedule.messages.loading}</Text>
      </GlassCard>
    )
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Current Status */}
      <GlassCard inset p={{ base: 4, md: 6 }}>
        <Heading size={{ base: 'sm', md: 'md' }} mb={4}>
          {backups.schedule.title}
        </Heading>

        <VStack gap={3} align="stretch">
          <HStack justify="space-between" wrap="wrap">
            <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
              {backups.schedule.status}:
            </Text>
            <Text
              color={scheduleData?.config?.enabled ? 'green.500' : 'red.500'}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {scheduleData?.config?.enabled ? backups.schedule.enabled : backups.schedule.disabled}
            </Text>
          </HStack>

          {scheduleData?.config?.enabled && (
            <>
              <HStack justify="space-between" wrap="wrap">
                <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
                  {backups.schedule.frequency}:
                </Text>
                <Text fontSize={{ base: 'sm', md: 'md' }}>
                  {scheduleData?.config?.frequency
                    ? backups.schedule.frequency_options[
                        scheduleData.config
                          .frequency as keyof typeof backups.schedule.frequency_options
                      ] || scheduleData.config.frequency
                    : '-'}
                </Text>
              </HStack>

              <HStack justify="space-between" wrap="wrap">
                <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
                  {backups.schedule.mode}:
                </Text>
                <Text fontSize={{ base: 'sm', md: 'md' }}>
                  {scheduleData?.config?.mode
                    ? backups.schedule.mode_options[scheduleData.config.mode]
                    : '-'}
                </Text>
              </HStack>
              {scheduleData?.nextRun && (
                <HStack justify="space-between" wrap="wrap">
                  <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
                    {backups.schedule.nextRun}:
                  </Text>
                  <Text fontSize={{ base: 'sm', md: 'md' }}>
                    {new Date(scheduleData.nextRun).toLocaleString()}
                  </Text>
                </HStack>
              )}
            </>
          )}
        </VStack>
      </GlassCard>

      {/* Configuration */}
      <GlassCard inset p={{ base: 4, md: 6 }}>
        <Heading size={{ base: 'sm', md: 'md' }} mb={4}>
          {backups.schedule.configuration}
        </Heading>

        {/* Configuration Type Selection */}
        <Box mb={6}>
          <RadioGroup.Root
            defaultValue={configType}
            onValueChange={(details) => setConfigType(details.value as 'presets' | 'custom')}
            name="configType"
          >
            <Stack direction={{ base: 'column', sm: 'row' }} gap={4}>
              <RadioGroup.Item value="presets" key={'presets'}>
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                  {backups.schedule.presets}
                </RadioGroup.ItemText>
              </RadioGroup.Item>
              <RadioGroup.Item value="custom" key={'custom'}>
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                  {backups.schedule.custom}
                </RadioGroup.ItemText>
              </RadioGroup.Item>
            </Stack>
          </RadioGroup.Root>
        </Box>

        {configType === 'presets' ? (
          /* Preset Configuration */
          <VStack gap={4} align="stretch">
            <Box>
              <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }} mb={2}>
                {backups.schedule.presets}
              </Text>
              <SimpleSelect
                value={selectedPreset}
                onChange={setSelectedPreset}
                options={presetOptions}
              />
            </Box>
          </VStack>
        ) : (
          /* Custom Configuration */
          <VStack gap={4} align="stretch">
            {/* Enable/Disable */}
            <Box>
              <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }} mb={2}>
                Stato
              </Text>
              <RadioGroup.Root
                value={customConfig.enabled ? 'enabled' : 'disabled'}
                onValueChange={(details) =>
                  setCustomConfig((prev) => ({ ...prev, enabled: details.value === 'enabled' }))
                }
                name="enabledState"
              >
                <Stack direction={{ base: 'column', sm: 'row' }} gap={4}>
                  <RadioGroup.Item value="enabled">
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator />
                    <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                      {backups.schedule.enable}
                    </RadioGroup.ItemText>
                  </RadioGroup.Item>
                  <RadioGroup.Item value="disabled">
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator />
                    <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                      {backups.schedule.disable}
                    </RadioGroup.ItemText>
                  </RadioGroup.Item>
                </Stack>
              </RadioGroup.Root>
            </Box>

            {customConfig.enabled && (
              <>
                {/* Backup Mode */}
                <Box>
                  <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }} mb={1}>
                    {backups.schedule.mode}
                  </Text>
                  <Text fontSize="xs" color="textMuted" mb={2}>
                    {backups.schedule.help.mode}
                  </Text>
                  <RadioGroup.Root
                    value={customConfig.mode}
                    onValueChange={(details) =>
                      setCustomConfig((prev) => ({
                        ...prev,
                        mode: details.value as 'full' | 'world',
                      }))
                    }
                    name="backupMode"
                  >
                    <Stack direction={{ base: 'column', sm: 'row' }} gap={4}>
                      <RadioGroup.Item value="full">
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                          {backups.schedule.mode_options.full}
                        </RadioGroup.ItemText>
                      </RadioGroup.Item>
                      <RadioGroup.Item value="world">
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                          {backups.schedule.mode_options.world}
                        </RadioGroup.ItemText>
                      </RadioGroup.Item>
                    </Stack>
                  </RadioGroup.Root>
                </Box>

                {/* Frequency */}
                <Box>
                  <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }} mb={1}>
                    {backups.schedule.frequency}
                  </Text>
                  <Text fontSize="xs" color="textMuted" mb={2}>
                    {backups.schedule.help.frequency}
                  </Text>
                  <SimpleSelect
                    value={customConfig.frequency}
                    onChange={(value) =>
                      setCustomConfig((prev) => ({
                        ...prev,
                        frequency: value as BackupScheduleConfig['frequency'],
                      }))
                    }
                    options={frequencyOptions}
                  />
                </Box>

                {/* Time (for daily, every-x-days, weekly) */}
                {['daily', 'every-2-days', 'every-3-days', 'weekly'].includes(
                  customConfig.frequency
                ) && (
                  <Box>
                    <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }} mb={1}>
                      {backups.schedule.time}
                    </Text>
                    <Text fontSize="xs" color="textMuted" mb={2}>
                      {backups.schedule.help.time}
                    </Text>
                    <Input
                      type="time"
                      value={customConfig.dailyAt || '03:00'}
                      onChange={(e) =>
                        setCustomConfig((prev) => ({ ...prev, dailyAt: e.target.value }))
                      }
                      size={{ base: 'sm', md: 'md' }}
                    />
                  </Box>
                )}

                {/* Day (for weekly) */}
                {customConfig.frequency === 'weekly' && (
                  <Box>
                    <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }} mb={1}>
                      {backups.schedule.day}
                    </Text>
                    <Text fontSize="xs" color="textMuted" mb={2}>
                      {backups.schedule.help.day}
                    </Text>
                    <SimpleSelect
                      value={String(customConfig.weeklyOn || 1)}
                      onChange={(value) =>
                        setCustomConfig((prev) => ({ ...prev, weeklyOn: Number(value) }))
                      }
                      options={dayOptions}
                    />
                  </Box>
                )}

                {/* Custom Cron Pattern */}
                {customConfig.frequency === 'custom' && (
                  <Box>
                    <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }} mb={1}>
                      Pattern Cron
                    </Text>
                    <Text fontSize="xs" color="textMuted" mb={2}>
                      {backups.schedule.help.custom}
                    </Text>
                    <Input
                      value={customCron}
                      onChange={(e) => setCustomCron(e.target.value)}
                      placeholder="0 3 * * *"
                      size={{ base: 'sm', md: 'md' }}
                    />
                  </Box>
                )}
              </>
            )}
          </VStack>
        )}

        {/* Unified Save Button */}
        <Box mt={6} textAlign="center">
          <GlassButton
            onClick={configType === 'presets' ? handlePresetSubmit : handleCustomSubmit}
            loading={updateSchedule.isPending}
            size={{ base: 'md', md: 'lg' }}
            minH="48px"
            px={8}
            bg="brand.primary"
            color="white"
            _hover={{ bg: 'brand.secondary' }}
          >
            {backups.schedule.save}
          </GlassButton>
        </Box>

        {/* Success/Error Messages */}
        {updateSchedule.isSuccess && (
          <Box p={3} bg="green.100" borderRadius="md" mt={4}>
            <Text color="green.800" fontSize={{ base: 'sm', md: 'md' }}>
              {backups.schedule.messages.updateSuccess}
            </Text>
          </Box>
        )}

        {updateSchedule.isError && (
          <Box p={3} bg="red.100" borderRadius="md" mt={4}>
            <Text color="red.800" fontSize={{ base: 'sm', md: 'md' }}>
              {backups.schedule.messages.updateError}: {updateSchedule.error?.message}
            </Text>
          </Box>
        )}
      </GlassCard>
    </VStack>
  )
}
