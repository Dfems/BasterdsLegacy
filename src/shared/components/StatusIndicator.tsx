import { type JSX } from 'react'

import { Badge, HStack, Text } from '@chakra-ui/react'

type StatusIndicatorProps = {
  status: 'online' | 'offline' | 'warning' | 'error' | 'loading'
  label: string
  details?: string
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig = {
  online: {
    color: 'green',
    icon: '🟢',
    text: 'Online',
  },
  offline: {
    color: 'red',
    icon: '🔴',
    text: 'Offline',
  },
  warning: {
    color: 'orange',
    icon: '🟡',
    text: 'Warning',
  },
  error: {
    color: 'red',
    icon: '🔴',
    text: 'Error',
  },
  loading: {
    color: 'blue',
    icon: '🔄',
    text: 'Loading...',
  },
}

export const StatusIndicator = ({
  status,
  label,
  details,
  size = 'md',
}: StatusIndicatorProps): JSX.Element => {
  const config = statusConfig[status]
  const fontSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'
  const badgeSize = size === 'sm' ? 'xs' : 'sm'

  return (
    <HStack gap={3} align="center" wrap="wrap">
      <Text fontSize={fontSize} fontWeight="medium">
        {label}:
      </Text>
      <HStack gap={2}>
        <Text fontSize={badgeSize}>{config.icon}</Text>
        <Badge colorPalette={config.color} variant="solid" fontSize={badgeSize}>
          {config.text}
        </Badge>
      </HStack>
      {details && (
        <Text fontSize="xs" color="textMuted">
          {details}
        </Text>
      )}
    </HStack>
  )
}
