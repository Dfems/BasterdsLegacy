import { type JSX } from 'react'

import {
  Box,
  Button,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Kbd,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  FiAlertTriangle,
  FiDatabase,
  FiFileText,
  FiLock,
  FiRefreshCw,
  FiServer,
  FiSettings,
  FiTrash2,
} from 'react-icons/fi'

import { EnvironmentConfigForm } from '@/features/environment-config'
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
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  logDir: string
  logFileEnabled: boolean
  logRetentionDays: number
  logMaxFiles: number
}

type AdvancedTabContentProps = {
  envConfig: EnvironmentConfig | null
  envError: string | null
  envLoading: boolean
  onEnvConfigSave: (changes: Partial<EnvironmentConfig>) => Promise<void>
}

export const AdvancedTabContent = ({
  envConfig,
  envLoading,
  onEnvConfigSave,
}: AdvancedTabContentProps): JSX.Element => {
  const { settings: t } = useLanguage()

  const dangerousActions = [
    {
      id: 'reset-config',
      title: 'Reset Configurazioni',
      description: 'Ripristina tutte le configurazioni ai valori predefiniti',
      icon: FiRefreshCw,
      color: 'orange.400',
      action: () => console.log('Reset config'),
    },
    {
      id: 'clear-logs',
      title: 'Pulisci Logs',
      description: 'Elimina tutti i file di log precedenti',
      icon: FiTrash2,
      color: 'red.400',
      action: () => console.log('Clear logs'),
    },
    {
      id: 'restart-services',
      title: 'Riavvia Servizi',
      description: 'Riavvia tutti i servizi del sistema',
      icon: FiServer,
      color: 'yellow.400',
      action: () => console.log('Restart services'),
    },
  ]

  return (
    <VStack gap={6} w="full">
      {/* Header con Warning */}
      <GlassCard p={6} w="full">
        <VStack gap={4} align="stretch">
          <HStack gap={3}>
            <Icon as={FiSettings} color="red.400" boxSize={6} />
            <Heading size="md">Configurazioni Avanzate</Heading>
          </HStack>

          <Box p={4} bg="red.50" rounded="lg" border="2px" borderColor="red.200">
            <HStack gap={3} mb={3}>
              <Icon as={FiAlertTriangle} color="red.500" boxSize={5} />
              <Text fontWeight="bold" color="red.600">
                ⚠️ Modifica solo se sai cosa stai facendo
              </Text>
            </HStack>
            <Text fontSize="sm" color="red.600">
              Impostazioni per utenti esperti
            </Text>
          </Box>
        </VStack>
      </GlassCard>

      {/* Configurazioni Avanzate */}
      {envConfig && (
        <GlassCard p={6} w="full">
          <VStack gap={6} align="stretch">
            <HStack gap={3}>
              <Icon as={FiDatabase} color="blue.400" boxSize={5} />
              <Heading size="sm">Configurazioni Sistema Avanzate</Heading>
            </HStack>

            <EnvironmentConfigForm
              initialConfig={envConfig}
              onSave={onEnvConfigSave}
              loading={envLoading}
            />
          </VStack>
        </GlassCard>
      )}

      {/* SFTP Section */}
      <GlassCard p={6} w="full">
        <VStack gap={4} align="stretch">
          <HStack gap={3}>
            <Icon as={FiLock} color="green.400" boxSize={5} />
            <Heading size="sm">{t.sftp.title}</Heading>
          </HStack>

          <Text fontSize="sm" color="textMuted">
            {t.sftp.description}
          </Text>

          <Box
            p={4}
            bg="gray.50"
            rounded="lg"
            border="1px"
            borderColor="gray.200"
            fontFamily="mono"
          >
            <HStack gap={2} wrap="wrap">
              <Kbd fontSize="sm">{t.sftp.ssh}</Kbd>
              <Text fontSize="sm" color="textMuted">
                {t.sftp.user}
              </Text>
            </HStack>
          </Box>

          <Text fontSize="xs" color="textMuted">
            Utilizza un client SFTP o SSH per accedere direttamente al filesystem del server
          </Text>
        </VStack>
      </GlassCard>

      {/* Zona Pericolosa */}
      <GlassCard p={6} w="full">
        <VStack gap={6} align="stretch">
          <HStack gap={3}>
            <Icon as={FiAlertTriangle} color="red.400" boxSize={5} />
            <Heading size="sm" color="red.400">
              🚨 Zona Pericolosa
            </Heading>
          </HStack>

          <Text fontSize="sm" color="textMuted">
            Queste azioni possono avere effetti permanenti e irreversibili sul sistema. Procedi con
            estrema cautela.
          </Text>

          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
            {dangerousActions.map((action) => (
              <GridItem key={action.id}>
                <Box p={4} bg="red.50" rounded="lg" border="1px" borderColor="red.200">
                  <VStack gap={3} align="stretch">
                    <HStack gap={2}>
                      <Icon as={action.icon} color={action.color} boxSize={4} />
                      <Text fontWeight="semibold" fontSize="sm">
                        {action.title}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="textMuted" lineHeight="short">
                      {action.description}
                    </Text>
                    <Button size="sm" colorScheme="red" variant="outline" onClick={action.action}>
                      Esegui
                    </Button>
                  </VStack>
                </Box>
              </GridItem>
            ))}
          </Grid>
        </VStack>
      </GlassCard>

      {/* Logs e Diagnostica */}
      <GlassCard p={6} w="full">
        <VStack gap={4} align="stretch">
          <HStack gap={3}>
            <Icon as={FiFileText} color="purple.400" boxSize={5} />
            <Heading size="sm">Diagnostica e Logging</Heading>
          </HStack>

          <Text fontSize="sm" color="textMuted">
            Strumenti avanzati per la diagnostica e il monitoraggio del sistema
          </Text>

          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
            <Box
              p={4}
              bg="purple.50"
              rounded="lg"
              border="1px"
              borderColor="purple.200"
              cursor="pointer"
              transition="all 0.2s"
            >
              <VStack gap={2} align="start">
                <HStack gap={2}>
                  <Icon as={FiFileText} color="purple.400" />
                  <Text fontWeight="semibold" fontSize="sm">
                    Visualizza Logs
                  </Text>
                </HStack>
                <Text fontSize="xs" color="textMuted">
                  Accedi ai log di sistema in tempo reale
                </Text>
              </VStack>
            </Box>

            <Box
              p={4}
              bg="blue.50"
              rounded="lg"
              border="1px"
              borderColor="blue.200"
              cursor="pointer"
              transition="all 0.2s"
            >
              <VStack gap={2} align="start">
                <HStack gap={2}>
                  <Icon as={FiDatabase} color="blue.400" />
                  <Text fontWeight="semibold" fontSize="sm">
                    Diagnostica Sistema
                  </Text>
                </HStack>
                <Text fontSize="xs" color="textMuted">
                  Verifica lo stato di salute del server
                </Text>
              </VStack>
            </Box>
          </Grid>
        </VStack>
      </GlassCard>
    </VStack>
  )
}
