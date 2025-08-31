import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import LanguageProvider from './contexts/LanguageProvider.tsx'
import './index.css'

const system = createSystem(defaultConfig, {})
const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <ChakraProvider value={system}>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </QueryClientProvider>
  </ChakraProvider>
)
