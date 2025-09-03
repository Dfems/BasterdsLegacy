import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest'

import ModpackPage from '@/pages/management/ModpackPage'

// Mock fetch
global.fetch = vi.fn() as MockedFunction<typeof fetch>

const system = createSystem(defaultConfig)

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </ChakraProvider>
  )
}

describe('ModpackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(fetch as MockedFunction<typeof fetch>).mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          versions: {
            minecraft: ['1.21.1', '1.21', '1.20.1'],
            loaders: {
              Fabric: { label: 'Fabric', versions: { '1.21.1': 'latest' } },
              Forge: { label: 'Forge', versions: { '1.21.1': '52.0.31' } },
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
  })

  it('should render modpack page with default automatic mode', async () => {
    renderWithProviders(<ModpackPage />)

    expect(screen.getByText('Modpack')).toBeInTheDocument()
    expect(screen.getByText('Modalità:')).toBeInTheDocument()
    expect(screen.getByText('Automatica')).toBeInTheDocument()

    // During loading, button shows "Caricamento..."
    expect(screen.getByText('Caricamento...')).toBeInTheDocument()

    // After versions load, should show "Installa"
    await waitFor(
      () => {
        expect(screen.getByText('Installa')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should show supported versions information for Fabric', async () => {
    renderWithProviders(<ModpackPage />)

    // Wait for versions to load
    await waitFor(
      () => {
        expect(screen.getByText(/Versione Fabric: latest/)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })
})
