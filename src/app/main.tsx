import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'

import LanguageProvider from '@/entities/language/LanguageProvider.tsx'
import { ThemeModeProvider } from '@/entities/user/ThemeModeContext.tsx'
import '@/index.css'
import '@/shared/styles/colors.css'

import App from './App.tsx'

const system = createSystem(defaultConfig, {
  globalCss: {
    ':root': {
      '--chakra-fonts-body': `'Press Start 2P', cursive`,
      '--chakra-fonts-heading': `'Press Start 2P', cursive`,
      '--chakra-fonts-mono': `'Press Start 2P', cursive`,
    },
    'html, body': {
      fontFamily: `'Press Start 2P', cursive`,
    },
  },
  theme: {
    tokens: {
      fonts: {
        body: { value: `'Press Start 2P', cursive` },
        heading: { value: `'Press Start 2P', cursive` },
        mono: { value: `'Press Start 2P', cursive` },
      },
    },
    // Palette gaming-inspired per migliorare carattere e contrasti
    semanticTokens: {
      colors: {
        // Backgrounds - tonalità più profonde e caratteristiche
        bg: { value: { base: '#f1f5f9', _dark: '#0a0e1a' } },
        bgElevated: { value: { base: '#ffffff', _dark: '#1a1f2e' } },

        // Text - contrasti migliorati e garantita leggibilità
        text: { value: { base: '#1f2937', _dark: '#e5e7eb' } },
        textMuted: { value: { base: '#6b7280', _dark: '#9ca3af' } },
        textSubtle: { value: { base: '#9ca3af', _dark: '#6b7280' } },

        // Borders - più definiti
        border: { value: { base: '#e5e7eb', _dark: 'rgba(255, 255, 255, 0.15)' } },
        borderStrong: { value: { base: '#d1d5db', _dark: 'rgba(255, 255, 255, 0.25)' } },
        borderAccent: { value: { base: '#059669', _dark: '#10b981' } },

        // Surface - effetti glass potenziati con migliore adattamento tema
        surface: {
          value: {
            base: 'rgba(255, 255, 255, 0.9)',
            _dark: 'rgba(16, 185, 129, 0.08)',
          },
        },
        surfaceSolid: {
          value: {
            base: 'rgba(255, 255, 255, 0.95)',
            _dark: 'rgba(26, 31, 46, 0.9)',
          },
        },

        // Brand Colors - gaming palette
        'brand.primary': { value: { base: '#059669', _dark: '#10b981' } },
        'brand.secondary': { value: { base: '#ea580c', _dark: '#fb923c' } },
        'brand.tertiary': { value: { base: '#1e40af', _dark: '#3b82f6' } },

        // Accent Colors - correzioni per migliore leggibilità
        'accent.success': { value: { base: '#16a34a', _dark: '#22c55e' } },
        'accent.warning': { value: { base: '#d97706', _dark: '#f59e0b' } },
        'accent.danger': { value: { base: '#dc2626', _dark: '#ef4444' } },
        'accent.info': { value: { base: '#0284c7', _dark: '#0ea5e9' } },

        // Overrides per retrocompatibilità
        brand: { value: { base: '#059669', _dark: '#10b981' } },
        link: { value: { base: '#1e40af', _dark: '#60a5fa' } },
        accent: { value: { base: '#ea580c', _dark: '#fb923c' } },

        // Specifico per elementi gaming
        'gaming.primary': { value: { base: '#16a34a', _dark: '#22c55e' } },
        'gaming.gold': { value: { base: '#ca8a04', _dark: '#eab308' } },
        'gaming.crystal': { value: { base: '#7c3aed', _dark: '#a855f7' } },
      },
    },
  },
})
const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <ChakraProvider value={system}>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeModeProvider>
          <App />
        </ThemeModeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </ChakraProvider>
)
