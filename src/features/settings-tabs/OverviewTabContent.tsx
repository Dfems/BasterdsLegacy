import { type JSX } from 'react'

import {
  Badge,
  Box,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  FiCheckCircle,
  FiClock,
  FiDatabase,
  FiHardDrive,
  FiServer,
  FiWifi,
  FiXCircle,
} from 'react-icons/fi'

import { GlassCard } from '@/shared/components/GlassCard'
import useLanguage from '@/shared/hooks/useLanguage'

type Settings = {
  javaBin: string
  mcDir: string
  backupDir: string
  rcon: { enabled: boolean; host: string; port: number }
  backupCron: string
  retentionDays: number
  retentionWeeks: number
}

type OverviewTabContentProps = {
  settings: Settings | null
  loading: boolean
  error: string | null
  isOwner: boolean
}

export const OverviewTabContent = ({
  settings,
  loading,
  error,
  isOwner,
}: OverviewTabContentProps): JSX.Element => {
  const { settings: t } = useLanguage()

  if (loading) {
    return (
      <VStack gap={6}>
        <GlassCard p={8} w="full">
          <VStack gap={4}>
            <Text color="textMuted">{t.loading}</Text>
          </VStack>
        </GlassCard>
      </VStack>
    )
  }

  if (error) {
    return (
      <GlassCard p={8} w="full">
        <VStack gap={4}>
          <Icon as={FiXCircle} color="red.400" boxSize={8} />
          <Text color="red.400" fontWeight="semibold">
            {t.errorLoad}
          </Text>
          <Text color="textMuted" fontSize="sm">
            {error}
          </Text>
        </VStack>
      </GlassCard>
    )
  }

  return (
    <VStack gap={6} w="full">
      {/* Stato Server */}
      <GlassCard p={6} w="full">
        <VStack gap={6} align="stretch">
          <HStack gap={3}>
            <Icon as={FiServer} color="green.400" boxSize={6} />
            <Heading size="md">Panoramica Server</Heading>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
            <Box p={4} bg="gray.50" rounded="lg">
              <Text fontSize="xs" color="textMuted" mb={2}>
                Java Runtime
              </Text>
              <Text fontSize="sm" fontWeight="semibold" color="textPrimary">
                {settings?.javaBin || 'N/A'}
              </Text>
            </Box>

            <Box p={4} bg="gray.50" rounded="lg">
              <Text fontSize="xs" color="textMuted" mb={2}>
                Directory Server
              </Text>
              <Text fontSize="sm" fontWeight="semibold" color="textPrimary">
                {settings?.mcDir || 'N/A'}
              </Text>
            </Box>

            <Box p={4} bg="gray.50" rounded="lg">
              <Text fontSize="xs" color="textMuted" mb={2}>
                RCON
              </Text>
              <HStack>
                <Badge
                  colorScheme={settings?.rcon.enabled ? 'green' : 'red'}
                  variant="subtle"
                  rounded="full"
                >
                  {settings?.rcon.enabled ? 'Abilitato' : 'Disabilitato'}
                </Badge>
                <Icon
                  as={settings?.rcon.enabled ? FiCheckCircle : FiXCircle}
                  color={settings?.rcon.enabled ? 'green.400' : 'red.400'}
                />
              </HStack>
            </Box>

            <Box p={4} bg="gray.50" rounded="lg">
              <Text fontSize="xs" color="textMuted" mb={2}>
                Backup Schedule
              </Text>
              <HStack>
                <Icon as={FiClock} color="blue.400" />
                <Text fontSize="sm" fontWeight="semibold" color="textPrimary">
                  {settings?.backupCron || 'Non configurato'}
                </Text>
              </HStack>
            </Box>
          </SimpleGrid>
        </VStack>
      </GlassCard>

      {/* Sistema e Storage */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6} w="full">
        <GridItem>
          <GlassCard p={6} h="full">
            <VStack gap={4} align="stretch">
              <HStack gap={3}>
                <Icon as={FiHardDrive} color="purple.400" boxSize={5} />
                <Heading size="sm">Storage</Heading>
              </HStack>

              <VStack gap={3} align="stretch">
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="sm" color="textMuted">
                      Directory Backup
                    </Text>
                    <Badge colorScheme="purple" variant="subtle" rounded="full">
                      Attivo
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" fontFamily="mono" color="textPrimary">
                    {settings?.backupDir || 'Non configurato'}
                  </Text>
                </Box>

                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="sm" color="textMuted">
                      Retention Policy
                    </Text>
                  </HStack>
                  <HStack gap={4}>
                    <VStack gap={1}>
                      <Text fontSize="lg" fontWeight="bold" color="purple.400">
                        {settings?.retentionDays || 0}
                      </Text>
                      <Text fontSize="xs" color="textMuted">
                        giorni
                      </Text>
                    </VStack>
                    <VStack gap={1}>
                      <Text fontSize="lg" fontWeight="bold" color="purple.400">
                        {settings?.retentionWeeks || 0}
                      </Text>
                      <Text fontSize="xs" color="textMuted">
                        settimane
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </VStack>
            </VStack>
          </GlassCard>
        </GridItem>

        <GridItem>
          <GlassCard p={6} h="full">
            <VStack gap={4} align="stretch">
              <HStack gap={3}>
                <Icon as={FiWifi} color="green.400" boxSize={5} />
                <Heading size="sm">Connettività</Heading>
              </HStack>

              <VStack gap={3} align="stretch">
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="sm" color="textMuted">
                      RCON Status
                    </Text>
                    <Badge
                      colorScheme={settings?.rcon.enabled ? 'green' : 'gray'}
                      variant="subtle"
                      rounded="full"
                    >
                      {settings?.rcon.enabled ? 'Abilitato' : 'Disabilitato'}
                    </Badge>
                  </HStack>
                  {settings?.rcon.enabled && (
                    <VStack gap={1} align="start">
                      <Text fontSize="sm" fontFamily="mono" color="textPrimary">
                        Host: {settings.rcon.host}
                      </Text>
                      <Text fontSize="sm" fontFamily="mono" color="textPrimary">
                        Port: {settings.rcon.port}
                      </Text>
                    </VStack>
                  )}
                </Box>

                <Box>
                  <Text fontSize="sm" color="textMuted" mb={2}>
                    Stato Connessione
                  </Text>
                  <HStack gap={2}>
                    <Icon as={FiCheckCircle} color="green.400" />
                    <Text fontSize="sm" color="green.400" fontWeight="semibold">
                      Online
                    </Text>
                  </HStack>
                </Box>
              </VStack>
            </VStack>
          </GlassCard>
        </GridItem>
      </Grid>

      {/* Azioni Rapide (solo per owner) */}
      {isOwner && (
        <GlassCard p={6} w="full">
          <VStack gap={4} align="stretch">
            <HStack gap={3}>
              <Icon as={FiDatabase} color="blue.400" boxSize={5} />
              <Heading size="sm">Azioni Rapide</Heading>
            </HStack>

            <Text fontSize="sm" color="textMuted">
              Accesso rapido alle funzioni principali di amministrazione
            </Text>

            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Box
                p={4}
                bg="blue.50"
                rounded="lg"
                border="1px"
                borderColor="blue.200"
                cursor="pointer"
                transition="all 0.2s"
              >
                <VStack gap={2}>
                  <Icon as={FiDatabase} color="blue.400" boxSize={6} />
                  <Text fontWeight="semibold" fontSize="sm">
                    Backup Manuale
                  </Text>
                  <Text fontSize="xs" color="textMuted" textAlign="center">
                    Crea un backup immediato
                  </Text>
                </VStack>
              </Box>

              <Box
                p={4}
                bg="green.50"
                rounded="lg"
                border="1px"
                borderColor="green.200"
                cursor="pointer"
                transition="all 0.2s"
              >
                <VStack gap={2}>
                  <Icon as={FiServer} color="green.400" boxSize={6} />
                  <Text fontWeight="semibold" fontSize="sm">
                    Riavvia Server
                  </Text>
                  <Text fontSize="xs" color="textMuted" textAlign="center">
                    Riavvio sicuro del server
                  </Text>
                </VStack>
              </Box>

              <Box
                p={4}
                bg="purple.50"
                rounded="lg"
                border="1px"
                borderColor="purple.200"
                cursor="pointer"
                transition="all 0.2s"
              >
                <VStack gap={2}>
                  <Icon as={FiWifi} color="purple.400" boxSize={6} />
                  <Text fontWeight="semibold" fontSize="sm">
                    Test RCON
                  </Text>
                  <Text fontSize="xs" color="textMuted" textAlign="center">
                    Verifica connessione
                  </Text>
                </VStack>
              </Box>
            </SimpleGrid>
          </VStack>
        </GlassCard>
      )}
    </VStack>
  )
}
