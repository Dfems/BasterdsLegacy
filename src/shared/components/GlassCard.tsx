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
      bg={inset ? 'surface' : 'surfaceSolid'}
      borderColor="borderAccent"
      boxShadow={inset ? 'sm' : 'md'}
      style={{ backdropFilter: 'blur(12px) saturate(130%)' }}
      color="text"
      {...props}
    >
      {children}
    </Box>
  )
}
