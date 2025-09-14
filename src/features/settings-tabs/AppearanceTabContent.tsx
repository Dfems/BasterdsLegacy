import { type JSX } from 'react'

import { Box, Heading, HStack, Icon, RadioGroup, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { FiEye, FiImage, FiSun } from 'react-icons/fi'

import { useThemeMode, type ThemeMode } from '@/entities/user/ThemeModeContext'
import { BackgroundRotationSettings } from '@/shared/components/BackgroundRotationSettings'
import { BackgroundUpload } from '@/shared/components/BackgroundUpload'
import { GlassCard } from '@/shared/components/GlassCard'
import useLanguage from '@/shared/hooks/useLanguage'

type AppearanceTabContentProps = {
  isOwner: boolean
}

export const AppearanceTabContent = ({ isOwner }: AppearanceTabContentProps): JSX.Element => {
  const { settings: t } = useLanguage()
  const tRecord = t as Record<string, unknown>
  const theme = useThemeMode()

  return (
    <VStack gap={6} w="full">
      {/* Tema e Modalità Colore */}
      <GlassCard p={6} w="full">
        <VStack gap={6} align="stretch">
          <HStack gap={3}>
            <Icon as={FiSun} color="orange.400" boxSize={6} />
            <Heading size="md">
              {(tRecord.appearance as Record<string, string>)?.title ||
                'Personalizzazione Interfaccia'}
            </Heading>
          </HStack>

          <Box>
            <Heading size="sm" mb={3} color="textPrimary">
              {t.theme.title}
            </Heading>
            <Text mb={4} fontSize="sm" color="textMuted">
              {t.theme.description}
            </Text>

            <RadioGroup.Root
              value={theme.mode}
              onValueChange={(details) => {
                const v = details.value ?? 'system'
                theme.setMode(v as ThemeMode)
              }}
            >
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <RadioGroup.Item value="system">
                  <Box
                    p={4}
                    rounded="lg"
                    border="2px"
                    borderColor={theme.mode === 'system' ? 'blue.400' : 'gray.200'}
                    bg={theme.mode === 'system' ? 'blue.50' : 'white'}
                    cursor="pointer"
                    transition="all 0.2s"
                  >
                    <RadioGroup.ItemHiddenInput />
                    <VStack gap={3}>
                      <Box
                        w={12}
                        h={8}
                        rounded="md"
                        bgGradient="linear(45deg, gray.200, gray.400)"
                        position="relative"
                        overflow="hidden"
                      >
                        <Box
                          position="absolute"
                          top={0}
                          left="50%"
                          w="50%"
                          h="full"
                          bg="gray.800"
                        />
                      </Box>
                      <VStack gap={1}>
                        <RadioGroup.ItemIndicator />
                        <Text fontWeight="semibold" fontSize="sm">
                          {t.theme.system}
                        </Text>
                        <Text fontSize="xs" color="textMuted" textAlign="center">
                          Segue il sistema
                        </Text>
                      </VStack>
                    </VStack>
                  </Box>
                </RadioGroup.Item>

                <RadioGroup.Item value="light">
                  <Box
                    p={4}
                    rounded="lg"
                    border="2px"
                    borderColor={theme.mode === 'light' ? 'blue.400' : 'gray.200'}
                    bg={theme.mode === 'light' ? 'blue.50' : 'white'}
                    cursor="pointer"
                    transition="all 0.2s"
                  >
                    <RadioGroup.ItemHiddenInput />
                    <VStack gap={3}>
                      <Box
                        w={12}
                        h={8}
                        rounded="md"
                        bg="gray.100"
                        border="1px"
                        borderColor="gray.300"
                      />
                      <VStack gap={1}>
                        <RadioGroup.ItemIndicator />
                        <Text fontWeight="semibold" fontSize="sm">
                          {t.theme.light}
                        </Text>
                        <Text fontSize="xs" color="textMuted" textAlign="center">
                          Modalità chiara
                        </Text>
                      </VStack>
                    </VStack>
                  </Box>
                </RadioGroup.Item>

                <RadioGroup.Item value="dark">
                  <Box
                    p={4}
                    rounded="lg"
                    border="2px"
                    borderColor={theme.mode === 'dark' ? 'blue.400' : 'gray.200'}
                    bg={theme.mode === 'dark' ? 'blue.50' : 'white'}
                    cursor="pointer"
                    transition="all 0.2s"
                  >
                    <RadioGroup.ItemHiddenInput />
                    <VStack gap={3}>
                      <Box
                        w={12}
                        h={8}
                        rounded="md"
                        bg="gray.800"
                        border="1px"
                        borderColor="gray.600"
                      />
                      <VStack gap={1}>
                        <RadioGroup.ItemIndicator />
                        <Text fontWeight="semibold" fontSize="sm">
                          {t.theme.dark}
                        </Text>
                        <Text fontSize="xs" color="textMuted" textAlign="center">
                          Modalità scura
                        </Text>
                      </VStack>
                    </VStack>
                  </Box>
                </RadioGroup.Item>
              </SimpleGrid>
            </RadioGroup.Root>

            <Box mt={4} p={3} bg="blue.50" rounded="lg" border="1px" borderColor="blue.200">
              <Text fontSize="sm" color="blue.600">
                {t.theme.current.replace('{theme}', theme.resolved)}
              </Text>
            </Box>
          </Box>
        </VStack>
      </GlassCard>

      {/* Sezioni per Owner */}
      {isOwner && (
        <>
          {/* Sfondo Personalizzato */}
          <GlassCard p={6} w="full">
            <VStack gap={6} align="stretch">
              <HStack gap={3}>
                <Icon as={FiImage} color="green.400" boxSize={6} />
                <Heading size="md">Sfondo Personalizzato</Heading>
              </HStack>

              <Box>
                <Text fontSize="sm" color="textMuted" mb={4}>
                  Carica un'immagine di sfondo personalizzata per l'interfaccia (solo proprietario)
                </Text>
                <Text fontSize="xs" color="textMuted" mb={4}>
                  Formati supportati: JPEG, PNG, WebP, GIF (max 5MB)
                </Text>
                <BackgroundUpload />
              </Box>
            </VStack>
          </GlassCard>

          {/* Rotazione Sfondi */}
          <GlassCard p={6} w="full">
            <VStack gap={6} align="stretch">
              <HStack gap={3}>
                <Icon as={FiImage} color="purple.400" boxSize={6} />
                <Heading size="md">Rotazione Sfondi Pubblici</Heading>
              </HStack>

              <Box>
                <Text fontSize="sm" color="textMuted" mb={4}>
                  Imposta l'intervallo per la rotazione degli sfondi pubblici
                </Text>
                <BackgroundRotationSettings />
              </Box>
            </VStack>
          </GlassCard>
        </>
      )}

      {/* Sezione Visualizzazione per non-owner */}
      {!isOwner && (
        <GlassCard p={6} w="full">
          <VStack gap={4}>
            <Icon as={FiEye} color="gray.400" boxSize={8} />
            <Heading size="sm" color="textMuted">
              Modalità Visualizzazione
            </Heading>
            <Text fontSize="sm" color="textMuted" textAlign="center" maxW="md">
              Alcune opzioni di personalizzazione sono disponibili solo per il proprietario del
              server. Puoi comunque modificare il tema e visualizzare le impostazioni correnti.
            </Text>
          </VStack>
        </GlassCard>
      )}
    </VStack>
  )
}
