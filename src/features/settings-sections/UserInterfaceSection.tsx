import { type JSX } from 'react'

import { Box, Heading, RadioGroup, Stack, Text } from '@chakra-ui/react'

import { useThemeMode, type ThemeMode } from '@/entities/user/ThemeModeContext'
import { BackgroundRotationSettings } from '@/shared/components/BackgroundRotationSettings'
import { BackgroundUpload } from '@/shared/components/BackgroundUpload'
import { GlassCard } from '@/shared/components/GlassCard'
import { useUiSettings } from '@/shared/hooks'
import useLanguage from '@/shared/hooks/useLanguage'

export const UserInterfaceSection = (): JSX.Element => {
  const { settings: t } = useLanguage()
  const theme = useThemeMode()
  const { isOwner } = useUiSettings()

  return (
    <Stack direction="column" gap={6}>
      {/* Sezione principale UI */}
      <GlassCard inset p={{ base: 4, md: 6 }}>
        <Stack direction="column" gap={4}>
          <Box>
            <Heading size={{ base: 'sm', md: 'md' }} mb={2}>
              🎨 Interfaccia Utente
            </Heading>
            <Text fontSize={{ base: 'xs', md: 'sm' }} color="textMuted">
              Personalizza l'aspetto e il comportamento dell'interfaccia
            </Text>
          </Box>

          {/* Sezione Tema */}
          <Box>
            <Heading size="xs" mb={3} color="textPrimary">
              🌙 {t.theme.title}
            </Heading>
            <Text mb={3} fontSize={{ base: 'xs', md: 'sm' }} color="textMuted">
              {t.theme.description}
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
                    {t.theme.system}
                  </RadioGroup.ItemText>
                </RadioGroup.Item>
                <RadioGroup.Item value="dark">
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator />
                  <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                    {t.theme.dark}
                  </RadioGroup.ItemText>
                </RadioGroup.Item>
                <RadioGroup.Item value="light">
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator />
                  <RadioGroup.ItemText fontSize={{ base: 'sm', md: 'md' }}>
                    {t.theme.light}
                  </RadioGroup.ItemText>
                </RadioGroup.Item>
              </Stack>
            </RadioGroup.Root>
            <Text mt={2} color="textMuted" fontSize={{ base: 'xs', md: 'sm' }}>
              {t.theme.current.replace('{theme}', theme.resolved)}
            </Text>
          </Box>
        </Stack>
      </GlassCard>

      {/* Background Upload - Solo per owner */}
      {isOwner && (
        <GlassCard inset p={{ base: 4, md: 6 }}>
          <Stack direction="column" gap={4}>
            <Box>
              <Heading size="xs" mb={2} color="textPrimary">
                🖼️ Sfondo Personalizzato
              </Heading>
              <Text fontSize={{ base: 'xs', md: 'sm' }} color="textMuted" mb={3}>
                Carica un'immagine di sfondo personalizzata per l'interfaccia (solo proprietario)
              </Text>
              <Text fontSize={{ base: 'xs', md: 'sm' }} color="textMuted">
                Formati supportati: JPEG, PNG, WebP, GIF (max 5MB)
              </Text>
            </Box>
            <BackgroundUpload />
          </Stack>
        </GlassCard>
      )}

      {/* Background Rotation Settings - Solo per owner */}
      {isOwner && <BackgroundRotationSettings />}
    </Stack>
  )
}
