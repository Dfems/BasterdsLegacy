import { type JSX, type ReactNode } from 'react'

import { Box, Text, VStack } from '@chakra-ui/react'

import { GlassCard } from './GlassCard'

type QuickActionCardProps = {
  title: string
  description?: string
  icon: string
  inset?: boolean
  children: ReactNode
  gradient?: string
  size?: 'sm' | 'md' | 'lg'
}

export const QuickActionCard = ({
  title,
  description,
  icon,
  inset = false,
  children,
  gradient = 'linear(135deg, blue.500/10, purple.500/10)',
  size = 'md',
}: QuickActionCardProps): JSX.Element => (
  <GlassCard
    p={size === 'sm' ? { base: 4, md: 5 } : size === 'lg' ? { base: 6, md: 7 } : { base: 5, md: 6 }}
    position="relative"
    overflow="hidden"
    bgGradient={gradient}
    borderWidth="1px"
    bg={inset ? 'surface' : 'surfaceSolid'}
    boxShadow={inset ? 'sm' : 'md'}
    borderColor="whiteAlpha.300"
    style={{ backdropFilter: 'blur(18px) saturate(160%)' }}
    _before={{
      content: '""',
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: 'radial-gradient(480px circle at 0 0, rgba(255,255,255,0.12), transparent 45%)',
    }}
  >
    {/* Background pattern */}
    <Box
      position="absolute"
      top={size === 'sm' ? '8px' : '12px'}
      right={size === 'sm' ? '8px' : '12px'}
      fontSize={size === 'sm' ? '3xl' : size === 'lg' ? '6xl' : '5xl'}
      opacity={0.12}
      color="accent.fg"
      transform="rotate(12deg)"
      zIndex={0}
    >
      {icon}
    </Box>

    <VStack gap={4} align="stretch" position="relative" zIndex={1}>
      {/* Header */}
      <Box textAlign="center">
        <Text fontSize={size === 'sm' ? '2xl' : size === 'lg' ? '4xl' : '3xl'} mb={2}>
          {icon}
        </Text>
        <Text
          fontSize={size === 'sm' ? { base: 'md', md: 'lg' } : { base: 'lg', md: 'xl' }}
          fontWeight="bold"
          color="accent.fg"
        >
          {title}
        </Text>
        {description && (
          <Text fontSize={size === 'sm' ? 'sm' : { base: 'sm', md: 'md' }} color="textMuted" mt={2}>
            {description}
          </Text>
        )}
      </Box>

      {/* Actions */}
      <Box>{children}</Box>
    </VStack>
  </GlassCard>
)
