import type { BoxProps, ButtonProps } from '@chakra-ui/react'

export const glassCard: BoxProps = {
  p: 4,
  borderWidth: '1px',
  rounded: 'md',
  bg: 'whiteAlpha.100',
  borderColor: 'whiteAlpha.200',
  boxShadow: 'md',
  style: { backdropFilter: 'blur(10px) saturate(120%)' },
}

export const glassPanel: BoxProps = {
  p: 2,
  borderWidth: '1px',
  rounded: 'md',
  bg: 'whiteAlpha.50',
  borderColor: 'whiteAlpha.200',
  boxShadow: 'sm',
  style: { backdropFilter: 'blur(6px) saturate(120%)' },
}

export const glassButton: ButtonProps = {
  variant: 'outline',
  colorScheme: 'whiteAlpha',
  borderColor: 'whiteAlpha.300',
  bg: 'whiteAlpha.100',
  boxShadow: 'sm',
  _hover: { bg: 'whiteAlpha.200', borderColor: 'whiteAlpha.400' },
}
