import type { JSX } from 'react'

import { Box, type BoxProps } from '@chakra-ui/react'

export type GlassCardProps = BoxProps & { inset?: boolean }

// Reusable glassmorphism container with consistent border, bg and blur
export function GlassCard({ children, inset = false, ...props }: GlassCardProps): JSX.Element {
  return (
    <Box
      p={inset ? 2 : 4}
      borderWidth="1px"
      rounded="md"
      bg={inset ? 'whiteAlpha.50' : 'whiteAlpha.100'}
      borderColor="whiteAlpha.200"
      boxShadow={inset ? 'sm' : 'md'}
      style={{ backdropFilter: 'blur(8px) saturate(120%)' }}
      {...props}
    >
      {children}
    </Box>
  )
}
