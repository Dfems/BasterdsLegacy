import { type JSX } from 'react'

import { Box, Grid, GridItem, Heading, HStack, Icon, Text, VStack } from '@chakra-ui/react'
import { FiDatabase, FiFolder, FiShield, FiWifi, FiTool } from 'react-icons/fi'

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

type SystemTabContentProps = {
  envConfig: EnvironmentConfig | null
  envError: string | null
  envLoading: boolean
  onEnvConfigSave: (changes: Partial<EnvironmentConfig>) => Promise<void>
  isOwner: boolean
}

export const SystemTabContent = ({
  envConfig,
  envError,
  envLoading,
  onEnvConfigSave,
  isOwner,
}: SystemTabContentProps): JSX.Element => {
  const { settings: t } = useLanguage()
  const tRecord = t as Record<string, unknown>

  if (!isOwner) {
    return (
      <GlassCard p={8} w="full">
        <VStack gap={4}>
          <Icon as={FiShield} color="orange.400" boxSize={8} />
          <Heading size="md" color="textMuted">
            {(tRecord.system as Record<string, string>)?.accessDenied || 'Accesso Limitato'}
          </Heading>
          <Text color="textMuted" textAlign="center" maxW="md">
            {(tRecord.system as Record<string, string>)?.ownerOnly ||
              'Le configurazioni di sistema sono disponibili solo per il proprietario del server.'}
          </Text>
        </VStack>
      </GlassCard>
    )
  }

  if (envLoading) {
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

  if (envError) {
    return (
      <GlassCard p={8} w="full">
        <VStack gap={4}>
          <Icon as={FiShield} color="red.400" boxSize={8} />
          <Heading size="md" color="red.400">
            {t.errorLoad}
          </Heading>
          <Text color="textMuted" fontSize="sm" textAlign="center">
            {envError}
          </Text>
        </VStack>
      </GlassCard>
    )
  }

  const configSections = [
    {
      id: 'java',
      title: 'Configurazione Java',
      icon: FiTool,
      color: 'orange.400',
      description: 'Eseguibile Java e parametri JVM',
    },
    {
      id: 'directories',
      title: 'Gestione Directory',
      icon: FiFolder,
      color: 'blue.400',
      description: 'Percorsi server, backup e logging',
    },
    {
      id: 'network',
      title: 'Connettività',
      icon: FiWifi,
      color: 'green.400',
      description: 'RCON e configurazioni di rete',
    },
    {
      id: 'logging',
      title: 'Sistema Logging',
      icon: FiDatabase,
      color: 'purple.400',
      description: 'Livelli log e retention',
    },
  ]

  return (
    <VStack gap={6} w="full">
      {/* Header */}
      <GlassCard p={6} w="full">
        <VStack gap={4} align="stretch">
          <HStack gap={3}>
            <Icon as={FiTool} color="blue.400" boxSize={6} />
            <Heading size="md">Configurazioni Sistema</Heading>
          </HStack>
          <Text fontSize="sm" color="textMuted">
            Gestisci le impostazioni del server
          </Text>
        </VStack>
      </GlassCard>

      {/* Panoramica Configurazioni */}
      <Grid
        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
        gap={4}
        w="full"
      >
        {configSections.map((section) => (
          <GridItem key={section.id}>
            <GlassCard
              p={4}
              h="full"
              cursor="pointer"
              _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
              transition="all 0.3s ease"
            >
              <VStack gap={3} align="center" textAlign="center">
                <Box
                  p={3}
                  rounded="full"
                  bg={`${section.color.split('.')[0]}.50`}
                  _dark={{ bg: `${section.color.split('.')[0]}.900/20` }}
                >
                  <Icon as={section.icon} color={section.color} boxSize={6} />
                </Box>
                <VStack gap={1}>
                  <Text fontWeight="semibold" fontSize="sm">
                    {section.title}
                  </Text>
                  <Text fontSize="xs" color="textMuted" lineHeight="short">
                    {section.description}
                  </Text>
                </VStack>
              </VStack>
            </GlassCard>
          </GridItem>
        ))}
      </Grid>

      {/* Form di Configurazione */}
      {envConfig && (
        <GlassCard p={6} w="full">
          <VStack gap={6} align="stretch">
            <HStack gap={3}>
              <Icon as={FiTool} color="blue.400" boxSize={5} />
              <Heading size="sm">Configurazioni Ambiente</Heading>
            </HStack>

            <Box p={4} bg="yellow.50" rounded="lg" border="1px" borderColor="yellow.200">
              <HStack gap={2}>
                <Icon as={FiShield} color="yellow.500" />
                <Text
                  fontSize="sm"
                  color="yellow.600"
                  _dark={{ color: 'yellow.300' }}
                  fontWeight="semibold"
                >
                  Attenzione:
                </Text>
              </HStack>
              <Text fontSize="sm" color="yellow.600" _dark={{ color: 'yellow.300' }} mt={1}>
                Modifica queste impostazioni solo se hai familiarità con la configurazione del
                server. Valori errati potrebbero compromettere il funzionamento del sistema.
              </Text>
            </Box>

            <EnvironmentConfigForm
              initialConfig={envConfig}
              onSave={onEnvConfigSave}
              loading={envLoading}
            />
          </VStack>
        </GlassCard>
      )}
    </VStack>
  )
}
