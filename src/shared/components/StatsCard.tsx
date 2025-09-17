import { type JSX, type ReactNode } from 'react'

import { Badge, Box, HStack, Text, VStack } from '@chakra-ui/react'

import { GlassCard } from './GlassCard'

type StatsCardProps = {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  inset?: boolean
  color?: string
  size?: 'sm' | 'md' | 'lg'
  badge?: {
    text: string
    color: string
    variant?: 'solid' | 'outline'
  }
  trend?:
    | {
        value: number
        isPositive?: boolean
      }
    | undefined
  action?: ReactNode
  isLoading?: boolean
  minH?: string
}

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  inset = false,
  color = 'accent.fg',
  size = 'md',
  badge,
  trend,
  action,
  isLoading = false,
  minH,
}: StatsCardProps): JSX.Element => (
  <GlassCard
    p={size === 'sm' ? { base: 3, md: 4 } : size === 'lg' ? { base: 5, md: 6 } : { base: 4, md: 5 }}
    h="100%"
    minH={minH ?? (size === 'sm' ? '96px' : size === 'lg' ? '140px' : '120px')}
    display="flex"
    flexDirection="column"
    justifyContent="space-between"
    position="relative"
    overflow="hidden"
    bg={inset ? 'surface' : 'surfaceSolid'}
    boxShadow={inset ? 'sm' : 'md'}
    style={{ backdropFilter: 'blur(12px) saturate(130%)' }}
    _before={{
      content: '""',
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: 'radial-gradient(420px circle at 0 0, rgba(255,255,255,0.1), transparent 45%)',
    }}
  >
    {/* Background icon */}
    {icon && (
      <Box
        position="absolute"
        bottom="8px"
        right="8px"
        fontSize={size === 'sm' ? 'xl' : size === 'lg' ? '3xl' : '2xl'}
        opacity={0.28}
        color={color}
        zIndex={0}
        pointerEvents="none"
      >
        {icon}
      </Box>
    )}

    <VStack align="stretch" gap={3} position="relative" zIndex={1}>
      {/* Header with title and badge */}
      <HStack justify="space-between" align="flex-start" gap={2}>
        <Text
          fontSize={
            size === 'sm'
              ? { base: 'xs', md: 'sm' }
              : size === 'lg'
                ? { base: 'md', md: 'lg' }
                : { base: 'sm', md: 'md' }
          }
          fontWeight="bold"
          color="textMuted"
          truncate
          minW={0}
          flex="1 1 auto"
        >
          {title}
        </Text>
        {badge && (
          <Badge
            colorPalette={badge.color}
            variant={badge.variant || 'solid'}
            fontSize={size === 'sm' ? 'xs' : { base: 'xs', md: 'sm' }}
            px={size === 'sm' ? 2 : 2}
            py={size === 'sm' ? 0.5 : 1}
            maxW={size === 'sm' ? '58%' : '65%'}
            overflow="hidden"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
          >
            {badge.text}
          </Badge>
        )}
      </HStack>

      {/* Main value */}
      <Box>
        {isLoading ? (
          <Text
            fontSize={
              size === 'sm'
                ? { base: 'lg', md: 'xl' }
                : size === 'lg'
                  ? { base: '2xl', md: '3xl' }
                  : { base: 'xl', md: '2xl' }
            }
            fontWeight="bold"
            color={color}
            truncate
            minW={0}
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            ...
          </Text>
        ) : (
          <Text
            fontSize={
              size === 'sm'
                ? { base: 'lg', md: 'xl' }
                : size === 'lg'
                  ? { base: '2xl', md: '3xl' }
                  : { base: 'xl', md: '2xl' }
            }
            fontWeight="bold"
            color={color}
            truncate
            minW={0}
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {value}
          </Text>
        )}

        {/* Trend indicator */}
        {trend && (
          <HStack gap={1} mt={1}>
            <Text fontSize="sm" color={trend.isPositive ? 'green.400' : 'red.400'}>
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </Text>
          </HStack>
        )}
      </Box>

      {/* Subtitle */}
      {subtitle && (
        <Text
          fontSize={size === 'sm' ? 'xs' : { base: 'xs', md: 'sm' }}
          color="textMuted"
          truncate
          minW={0}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {subtitle}
        </Text>
      )}

      {/* Action button */}
      {action && <Box mt="auto">{action}</Box>}
    </VStack>
  </GlassCard>
)
