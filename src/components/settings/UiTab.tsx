import type { JSX } from 'react'

import { Box, HStack, RadioGroup, Stack, Text, VStack } from '@chakra-ui/react'

import { useThemeMode, type ThemeMode } from '@/entities/user/ThemeModeContext'
import { BackgroundRotationSettings } from '@/shared/components/BackgroundRotationSettings'
import { BackgroundUpload } from '@/shared/components/BackgroundUpload'
import { GlassCard } from '@/shared/components/GlassCard'
import { useTranslation } from '@/shared/libs/i18n'

type UiTabProps = {
  isOwner: boolean
}

export const UiTab = ({ isOwner }: UiTabProps): JSX.Element => {
  const { t } = useTranslation()
  const theme = useThemeMode()

  return (
    <VStack gap={6} align="stretch">
      {/* Hero Card */}
      <GlassCard
        bgGradient="linear(135deg, purple.100/10, pink.300/5)"
        borderColor="purple.200"
        p={8}
      >
        <VStack gap={4} textAlign="center">
          <Text fontSize="3xl">🎨</Text>
          <Text fontSize="xl" fontWeight="bold" color="purple.fg">
            {t.settings.tabs.ui.title}
          </Text>
          <Text color="textMuted" maxW="md">
            {t.settings.tabs.ui.description}
          </Text>
        </VStack>
      </GlassCard>

      {/* Theme Configuration */}
      <GlassCard inset p={6}>
        <HStack gap={4} align="start">
          <Text fontSize="2xl">🌙</Text>
          <Box flex={1}>
            <Text fontWeight="semibold" mb={2} fontSize="lg">
              {t.settings.theme.title}
            </Text>
            <Text color="textMuted" fontSize="sm" mb={4}>
              {t.settings.theme.description}
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
                    {t.settings.theme.system}
                  </RadioGroup.ItemText>
                </RadioGroup.Item>
                <RadioGroup.Item value="dark">
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator />
                  <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                    {t.settings.theme.dark}
                  </RadioGroup.ItemText>
                </RadioGroup.Item>
                <RadioGroup.Item value="light">
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator />
                  <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                    {t.settings.theme.light}
                  </RadioGroup.ItemText>
                </RadioGroup.Item>
              </Stack>
            </RadioGroup.Root>

            <Text mt={3} color="textMuted" fontSize="sm">
              {t.settings.theme.current.replace('{theme}', theme.resolved)}
            </Text>
          </Box>
        </HStack>
      </GlassCard>

      {/* Background Management - Solo per owner */}
      {isOwner && (
        <>
          <GlassCard inset p={6}>
            <HStack gap={4} align="start">
              <Text fontSize="2xl">🖼️</Text>
              <Box flex={1}>
                <Text fontWeight="semibold" mb={2} fontSize="lg">
                  Background Upload
                </Text>
                <Text color="textMuted" fontSize="sm" mb={4}>
                  Carica e gestisci gli sfondi personalizzati del server
                </Text>
                <BackgroundUpload />
              </Box>
            </HStack>
          </GlassCard>

          <GlassCard inset p={6}>
            <HStack gap={4} align="start">
              <Text fontSize="2xl">🔄</Text>
              <Box flex={1}>
                <Text fontWeight="semibold" mb={2} fontSize="lg">
                  Background Rotation
                </Text>
                <Text color="textMuted" fontSize="sm" mb={4}>
                  Configura la rotazione automatica degli sfondi
                </Text>
                <BackgroundRotationSettings />
              </Box>
            </HStack>
          </GlassCard>
        </>
      )}
    </VStack>
  )
}
