import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import LanguageProvider from './contexts/LanguageProvider.tsx'
import { ThemeModeProvider } from './contexts/ThemeModeContext.tsx'
import './index.css'

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
    // Palette semantic per light/dark, focalizzata su leggibilità
    semanticTokens: {
      colors: {
        bg: { value: { base: '#f8fafc', _dark: '#0b1220' } },
        text: { value: { base: 'gray.800', _dark: 'gray.100' } },
        muted: { value: { base: 'gray.600', _dark: 'gray.400' } },
        border: { value: { base: 'blackAlpha.200', _dark: 'whiteAlpha.200' } },
        borderStrong: { value: { base: 'blackAlpha.300', _dark: 'whiteAlpha.300' } },
        surface: {
          value: { base: 'rgba(255, 255, 255, 0.72)', _dark: 'rgba(17, 25, 40, 0.65)' },
        },
        surfaceSolid: {
          value: { base: 'rgba(255, 255, 255, 0.98)', _dark: 'rgba(17, 25, 40, 0.85)' },
        },
        brand: { value: { base: 'teal.700', _dark: 'green.300' } },
        link: { value: { base: 'blue.600', _dark: 'blue.300' } },
        accent: { value: { base: 'teal.600', _dark: 'green.300' } },
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
