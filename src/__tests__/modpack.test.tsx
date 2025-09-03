import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

const mockVersionsResponse = {
  ok: true,
  versions: {
    minecraft: ['1.21.1', '1.21', '1.20.1'],
    loaders: {
      Fabric: {
        label: 'Fabric',
        versions: { '1.21.1': 'latest', '1.21': 'latest', '1.20.1': 'latest' },
      },
      Forge: { label: 'Forge', versions: { '1.21.1': '52.0.31', '1.20.1': '47.3.12' } },
      Quilt: { label: 'Quilt', versions: { '1.21.1': 'latest', '1.20.1': 'latest' } },
      NeoForge: { label: 'NeoForge', versions: { '1.21.1': 'latest', '1.20.1': 'latest' } },
    },
  },
}

describe('ModpackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(fetch as MockedFunction<typeof fetch>).mockResolvedValue(
      new Response(JSON.stringify(mockVersionsResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('should render modpack page title', () => {
    renderWithProviders(<ModpackPage />)
    expect(screen.getByText('Modpack')).toBeInTheDocument()
  })

  it('should show loading state initially', () => {
    renderWithProviders(<ModpackPage />)
    expect(screen.getByText('Caricamento...')).toBeInTheDocument()
  })

  it('should show mode selection', () => {
    renderWithProviders(<ModpackPage />)
    expect(screen.getByText('Modalità:')).toBeInTheDocument()
  })

  it('should show install button after loading', async () => {
    renderWithProviders(<ModpackPage />)

    await waitFor(
      () => {
        expect(screen.getByText('Installa')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should show version information after loading', async () => {
    renderWithProviders(<ModpackPage />)

    await waitFor(
      () => {
        expect(screen.getByText(/Versione Fabric: latest/)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should handle API call on install button click', async () => {
    const user = userEvent.setup()

    // Mock successful installation
    ;(fetch as MockedFunction<typeof fetch>)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockVersionsResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            notes: ['Installation successful'],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )

    renderWithProviders(<ModpackPage />)

    await waitFor(() => {
      expect(screen.getByText('Installa')).toBeInTheDocument()
    })

    const installButton = screen.getByText('Installa')
    await user.click(installButton)

    // Should show installing state
    expect(screen.getByText('Installazione…')).toBeInTheDocument()

    // Wait for completion
    await waitFor(
      () => {
        expect(screen.getByDisplayValue(/Installation successful/)).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })

  it('should handle API errors', async () => {
    const user = userEvent.setup()

    ;(fetch as MockedFunction<typeof fetch>)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockVersionsResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: 'Test error',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )

    renderWithProviders(<ModpackPage />)

    await waitFor(() => {
      expect(screen.getByText('Installa')).toBeInTheDocument()
    })

    const installButton = screen.getByText('Installa')
    await user.click(installButton)

    await waitFor(
      () => {
        expect(screen.getByDisplayValue(/Errore: Test error/)).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })

  it('should handle versions loading error', async () => {
    ;(fetch as MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'))

    renderWithProviders(<ModpackPage />)

    await waitFor(() => {
      expect(screen.getByText(/Errore nel caricamento delle versioni/)).toBeInTheDocument()
    })
  })

  it('should show automatic installation helper text', async () => {
    renderWithProviders(<ModpackPage />)

    await waitFor(
      () => {
        expect(
          screen.getByText(/Scaricherà automaticamente l'installer per Fabric 1\.21\.1/)
        ).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })
})
