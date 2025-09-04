import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, afterEach, describe, expect, it, vi, type MockedFunction } from 'vitest'

import ModpackPage from '@/pages/management/ModpackPage'

// Mock useLanguage
vi.mock('@/shared/hooks/useLanguage', () => ({
  default: () => ({
    modpack: {
      title: 'Modpack',
      mode: 'Modalità',
      automatic: 'Automatica',
      manual: 'Manuale (JAR personalizzato)',
      install: 'Installa',
      installing: 'Installazione…',
      installAuto: "Scaricherà automaticamente l'installer per {loader} {version}",
      notes: 'Note',
      versionInfo: 'Versione {loader}: {version}',
      errorVersions: 'Errore nel caricamento delle versioni: {error}',
      versionUnsupported: '⚠️ Versione {version} non supportata da {loader}',
      jarPlaceholder: 'Nome del file JAR (es. forge-installer.jar)',
      jarHelp: 'Il JAR deve essere già presente nella directory del server',
    },
    common: {
      loading: 'Caricamento...',
    },
  }),
}))

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

  afterEach(() => {
    cleanup()
  })

  it('should render modpack page title', () => {
    renderWithProviders(<ModpackPage />)
    expect(screen.getByText('Modpack')).toBeInTheDocument()
  })

  it('should show loading state initially', () => {
    renderWithProviders(<ModpackPage />)
    expect(screen.getAllByText('Caricamento...').length).toBeGreaterThanOrEqual(1)
  })

  it('should show mode selection', () => {
    renderWithProviders(<ModpackPage />)
    expect(screen.getAllByText('Modalità:')[0]).toBeInTheDocument()
  })

  it('should show install button after loading', async () => {
    renderWithProviders(<ModpackPage />)

    await waitFor(
      () => {
        expect(screen.getAllByText('Installa')[0]).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should show version information after loading', async () => {
    renderWithProviders(<ModpackPage />)

    await waitFor(
      () => {
        const versionElements = screen.getAllByText(/Versione Fabric: latest/)
        expect(versionElements.length).toBeGreaterThan(0)
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
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(
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
            }, 100)
          })
      )

    renderWithProviders(<ModpackPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Installa')[0]).toBeInTheDocument()
    })

    const installButtons = screen.getAllByText('Installa')
    await user.click(installButtons[0]!)

    // Should show installing state
    await waitFor(
      () => {
        expect(screen.getByText('Installazione…')).toBeInTheDocument()
      },
      { timeout: 1000 }
    )

    // Wait for completion
    await waitFor(
      () => {
        const textareas = screen.getAllByDisplayValue(/Installation successful/)
        expect(textareas.length).toBeGreaterThan(0)
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
      expect(screen.getAllByText('Installa')[0]).toBeInTheDocument()
    })

    const installButtons = screen.getAllByText('Installa')
    await user.click(installButtons[0]!)

    await waitFor(
      () => {
        const errorTextareas = screen.getAllByDisplayValue(/Errore: Test error/)
        expect(errorTextareas.length).toBeGreaterThan(0)
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
        const helperTexts = screen.getAllByText(
          /Scaricherà automaticamente l'installer per Fabric 1\.21\.1/
        )
        expect(helperTexts.length).toBeGreaterThan(0)
      },
      { timeout: 3000 }
    )
  })
})
