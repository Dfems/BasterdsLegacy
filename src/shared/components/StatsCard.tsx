import { type JSX, type ReactNode } from 'react'

import { Badge, Box, HStack, Text, VStack } from '@chakra-ui/react'

import { GlassCard } from './GlassCard'

type StatsCardProps = {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  color?: string
  badge?: {
    text: string
    color: string
    variant?: 'solid' | 'outline'
  }
  trend?: {
    value: number
    isPositive?: boolean
  } | undefined
  action?: ReactNode
  isLoading?: boolean
  minH?: string
}

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  color = 'accent.fg',
  badge,
  trend,
  action,
  isLoading = false,
  minH = '120px',
}: StatsCardProps): JSX.Element => (
  <GlassCard
    p={{ base: 4, md: 5 }}
    h="100%"
    minH={minH}
    display="flex"
    flexDirection="column"
    justifyContent="space-between"
    position="relative"
    overflow="hidden"
  >
    {/* Background icon */}
    {icon && (
      <Box
        position="absolute"
        top="8px"
        right="8px"
        fontSize="2xl"
        opacity={0.3}
        color={color}
        zIndex={0}
      >
        {icon}
      </Box>
    )}

    <VStack align="stretch" gap={3} position="relative" zIndex={1}>
      {/* Header with title and badge */}
      <HStack justify="space-between" align="flex-start">
        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color="textMuted">
          {title}
        </Text>
        {badge && (
          <Badge
            colorPalette={badge.color}
            variant={badge.variant || 'solid'}
            fontSize={{ base: 'xs', md: 'sm' }}
          >
            {badge.text}
          </Badge>
        )}
      </HStack>

      {/* Main value */}
      <Box>
        {isLoading ? (
          <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color={color}>
            ...
          </Text>
        ) : (
          <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color={color}>
            {value}
          </Text>
        )}
        
        {/* Trend indicator */}
        {trend && (
          <HStack gap={1} mt={1}>
            <Text
              fontSize="sm"
              color={trend.isPositive ? 'green.400' : 'red.400'}
            >
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </Text>
          </HStack>
        )}
      </Box>

      {/* Subtitle */}
      {subtitle && (
        <Text fontSize={{ base: 'xs', md: 'sm' }} color="textMuted">
          {subtitle}
        </Text>
      )}

      {/* Action button */}
      {action && <Box mt="auto">{action}</Box>}
    </VStack>
  </GlassCard>
)