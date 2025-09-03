import type { BoxProps, ButtonProps } from '@chakra-ui/react'

// Glass Card - gaming themed con effetti migliorati
export const glassCard: BoxProps = {
  p: 4,
  borderWidth: '1px',
  rounded: 'lg',
  bg: { base: 'rgba(255, 255, 255, 0.9)', _dark: 'rgba(16, 185, 129, 0.08)' },
  borderColor: { base: 'rgba(5, 150, 105, 0.2)', _dark: 'rgba(16, 185, 129, 0.25)' },
  boxShadow: {
    base: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
    _dark: '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  },
  style: {
    backdropFilter: 'blur(12px) saturate(130%)',
    background:
      'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)',
  },
  transition: 'all 0.2s ease',
  _hover: {
    transform: 'translateY(-2px)',
    boxShadow: {
      base: '0 6px 20px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      _dark: '0 12px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
    },
  },
}

export const glassPanel: BoxProps = {
  p: 3,
  borderWidth: '1px',
  rounded: 'md',
  bg: { base: 'rgba(255, 255, 255, 0.8)', _dark: 'rgba(16, 185, 129, 0.06)' },
  borderColor: { base: 'rgba(5, 150, 105, 0.15)', _dark: 'rgba(16, 185, 129, 0.2)' },
  boxShadow: {
    base: '0 2px 8px rgba(0, 0, 0, 0.05)',
    _dark: '0 4px 16px rgba(0, 0, 0, 0.2)',
  },
  style: { backdropFilter: 'blur(8px) saturate(120%)' },
  transition: 'all 0.2s ease',
}

export const glassButton: ButtonProps = {
  variant: 'outline',
  colorScheme: 'whiteAlpha',
  borderColor: { base: 'brand.primary', _dark: 'rgba(16, 185, 129, 0.3)' },
  bg: { base: 'rgba(255, 255, 255, 0.8)', _dark: 'rgba(16, 185, 129, 0.08)' },
  boxShadow: {
    base: '0 2px 8px rgba(0, 0, 0, 0.08)',
    _dark: '0 4px 16px rgba(0, 0, 0, 0.25)',
  },
  style: { backdropFilter: 'blur(10px) saturate(120%)' },
  transition: 'all 0.2s ease',
  _hover: {
    bg: { base: 'rgba(255, 255, 255, 0.9)', _dark: 'rgba(16, 185, 129, 0.12)' },
    borderColor: { base: 'brand.secondary', _dark: 'rgba(16, 185, 129, 0.4)' },
    transform: 'translateY(-1px)',
    filter: 'brightness(1.1) saturate(120%)',
  },
}
