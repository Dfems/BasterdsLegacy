import { type JSX, type ReactNode } from 'react'

import { Box, Text, VStack } from '@chakra-ui/react'

import { GlassCard } from './GlassCard'

type QuickActionCardProps = {
  title: string
  description?: string
  icon: string
  children: ReactNode
  gradient?: string
}

export const QuickActionCard = ({
  title,
  description,
  icon,
  children,
  gradient = 'linear(135deg, blue.500/10, purple.500/10)',
}: QuickActionCardProps): JSX.Element => (
  <GlassCard
    p={{ base: 5, md: 6 }}
    position="relative"
    overflow="hidden"
    bgGradient={gradient}
    borderWidth="1px"
    borderColor="whiteAlpha.200"
  >
    {/* Background pattern */}
    <Box
      position="absolute"
      top="-20px"
      right="-20px"
      fontSize="6xl"
      opacity={0.1}
      color="accent.fg"
      transform="rotate(15deg)"
      zIndex={0}
    >
      {icon}
    </Box>

    <VStack spacing={4} align="stretch" position="relative" zIndex={1}>
      {/* Header */}
      <Box textAlign="center">
        <Text fontSize="3xl" mb={2}>
          {icon}
        </Text>
        <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color="accent.fg">
          {title}
        </Text>
        {description && (
          <Text fontSize={{ base: 'sm', md: 'md' }} color="textMuted" mt={2}>
            {description}
          </Text>
        )}
      </Box>

      {/* Actions */}
      <Box>{children}</Box>
    </VStack>
  </GlassCard>
)