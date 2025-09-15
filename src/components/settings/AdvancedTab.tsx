import type { JSX } from 'react'

import { Box, HStack, Kbd, Text, VStack } from '@chakra-ui/react'

import { GlassCard } from '@/shared/components/GlassCard'
import { useTranslation } from '@/shared/libs/i18n'

export const AdvancedTab = (): JSX.Element => {
  const { t } = useTranslation()

  return (
    <VStack gap={6} align="stretch">
      {/* Hero Card */}
      <GlassCard
        bgGradient="linear(135deg, orange.100/10, red.300/5)"
        borderColor="orange.200"
        p={8}
      >
        <VStack gap={4} textAlign="center">
          <Text fontSize="3xl">🔧</Text>
          <Text fontSize="xl" fontWeight="bold" color="orange.fg">
            {t.settings.tabs.advanced.title}
          </Text>
          <Text color="textMuted" maxW="md">
            {t.settings.tabs.advanced.description}
          </Text>
        </VStack>
      </GlassCard>

      {/* SFTP Configuration */}
      <GlassCard inset p={6}>
        <HStack gap={4} align="start">
          <Text fontSize="2xl">📁</Text>
          <Box flex={1}>
            <Text fontWeight="semibold" mb={2} fontSize="lg">
              {t.settings.sftp.title}
            </Text>
            <Text color="textMuted" fontSize="sm" mb={4}>
              {t.settings.sftp.description}
            </Text>

            <VStack align="start" gap={3}>
              <Box>
                <Text fontSize="sm" color="textMuted" mb={2}>
                  Comando SSH:
                </Text>
                <HStack gap={2} wrap="wrap">
                  <Kbd fontSize="sm">{t.settings.sftp.ssh}</Kbd>
                  <Text fontSize="sm">{t.settings.sftp.user}</Text>
                </HStack>
              </Box>

              <Box
                bg="surface"
                borderRadius="md"
                p={4}
                borderWidth="1px"
                borderColor="borderAccent"
                w="full"
              >
                <Text fontSize="xs" color="textMuted" mb={2}>
                  Esempio di connessione:
                </Text>
                <Text fontSize="sm" fontFamily="mono" color="text">
                  ssh minecraft@your-server.com
                </Text>
              </Box>
            </VStack>
          </Box>
        </HStack>
      </GlassCard>

      {/* Security Information */}
      <GlassCard inset p={6}>
        <HStack gap={4} align="start">
          <Text fontSize="2xl">🔐</Text>
          <Box flex={1}>
            <Text fontWeight="semibold" mb={2} fontSize="lg">
              Sicurezza & Accesso
            </Text>
            <Text color="textMuted" fontSize="sm" mb={4}>
              Informazioni importanti sulla sicurezza del server
            </Text>

            <VStack align="start" gap={3}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  🔑 Autenticazione
                </Text>
                <Text fontSize="sm" color="textMuted">
                  L'accesso SFTP utilizza chiavi SSH per la massima sicurezza
                </Text>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  📂 Permessi File
                </Text>
                <Text fontSize="sm" color="textMuted">
                  L'utente dedicato ha accesso limitato alle directory del server
                </Text>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  🔄 Backup Automatici
                </Text>
                <Text fontSize="sm" color="textMuted">
                  I backup vengono eseguiti automaticamente secondo la pianificazione configurata
                </Text>
              </Box>
            </VStack>
          </Box>
        </HStack>
      </GlassCard>

      {/* System Information */}
      <GlassCard inset p={6}>
        <HStack gap={4} align="start">
          <Text fontSize="2xl">💻</Text>
          <Box flex={1}>
            <Text fontWeight="semibold" mb={2} fontSize="lg">
              Informazioni Sistema
            </Text>
            <Text color="textMuted" fontSize="sm" mb={4}>
              Dettagli tecnici del server e dell'ambiente
            </Text>

            <VStack align="start" gap={3}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  🐧 Sistema Operativo
                </Text>
                <Text fontSize="sm" color="textMuted">
                  Linux con supporto OpenSSH nativo
                </Text>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  ☕ Runtime Java
                </Text>
                <Text fontSize="sm" color="textMuted">
                  Java JRE/JDK configurato per Minecraft Server
                </Text>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  🔧 Gestione Processi
                </Text>
                <Text fontSize="sm" color="textMuted">
                  Supervisione automatica e restart del server Minecraft
                </Text>
              </Box>
            </VStack>
          </Box>
        </HStack>
      </GlassCard>

      {/* Warning Notice */}
      <GlassCard inset p={6} borderColor="amber.300" bg="amber.50/10">
        <HStack gap={4} align="start">
          <Text fontSize="2xl">⚠️</Text>
          <Box flex={1}>
            <Text fontWeight="semibold" mb={2} fontSize="lg" color="amber.600">
              Avviso Importante
            </Text>
            <VStack align="start" gap={2}>
              <Text fontSize="sm" color="amber.700">
                • Le modifiche avanzate possono influire sulla stabilità del server
              </Text>
              <Text fontSize="sm" color="amber.700">
                • Assicurati di avere backup recenti prima di apportare modifiche critiche
              </Text>
              <Text fontSize="sm" color="amber.700">
                • Contatta l'amministratore per supporto tecnico specializzato
              </Text>
            </VStack>
          </Box>
        </HStack>
      </GlassCard>
    </VStack>
  )
}
