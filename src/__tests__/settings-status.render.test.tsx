import type { JSX } from 'react'

import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardPage from '@/pages/server/DashboardPage'
import SettingsPage from '@/pages/server/SettingsPage'
import { I18nProvider } from '@/shared/libs/i18n'

// Mock del hook useLanguage per i test
vi.mock('@/shared/hooks/useLanguage', () => ({
  default: () => ({
    dashboard: {
      title: 'Dashboard',
      state: 'State',
      cpu: 'CPU',
      memory: 'Memory',
      uptime: 'Uptime',
      actions: 'Actions',
      start: 'Start',
      stop: 'Stop',
      restart: 'Restart',
      running: 'Running',
      stopped: 'Stopped',
      crashed: 'Crashed',
      unknown: 'Unknown',
      operationStarted: 'Operation {action} started',
      operationError: 'Error {action}: {error}',
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
    },
    settings: {
      title: 'Settings',
      loading: 'Loading...',
      errorLoad: 'Error loading settings',
      sftp: {
        title: 'SFTP OS-level',
        description: 'Use system OpenSSH with dedicated user',
        ssh: 'ssh',
        user: 'user@server',
      },
      theme: {
        title: 'Theme',
        description: 'Choose color mode',
        system: 'System',
        dark: 'Dark',
        light: 'Light',
        current: 'Current: {theme}',
      },
    },
  }),
}))

// Mock useUiSettings hook
vi.mock('@/shared/hooks', () => ({
  useUiSettings: () => ({
    settings: { backgroundImage: null },
    loading: false,
    error: null,
    updateBackgroundImage: vi.fn(),
    uploadBackgroundImage: vi.fn(),
    getBackgroundImageUrl: vi.fn(),
    refetch: vi.fn(),
    isOwner: false,
  }),
}))

// Mock useThemeMode hook
vi.mock('@/entities/user/ThemeModeContext', () => ({
  useThemeMode: () => ({
    mode: 'system',
    setMode: vi.fn(),
    resolved: 'dark',
  }),
}))

// Removed fake timers
// vi.useFakeTimers()

describe('Settings and Dashboard render basics', () => {
  const fetchSpy = vi.spyOn(window, 'fetch')
  const system = createSystem(defaultConfig, {})
  const wrap = (ui: JSX.Element) => (
    <ChakraProvider value={system}>
      <I18nProvider>
        <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>
      </I18nProvider>
    </ChakraProvider>
  )

  beforeEach(() => {
    fetchSpy.mockReset()
  })

  it('renders settings values', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        javaBin: 'java',
        mcDir: '/srv/mc',
        backupDir: '/srv/mc/backups',
        rcon: { enabled: false, host: '127.0.0.1', port: 25575 },
        backupCron: '0 0 * * *',
        retentionDays: 7,
        retentionWeeks: 4,
      }),
      headers: new Headers(),
    } as unknown as Response)

    render(wrap(<SettingsPage />))
    // titolo campo statico e valore da fetch mockato (accetta lingue diverse)
    const title = await screen.findByText(/(Settings|Impostazioni|Ajustes)/i)
    expect(title).toBeTruthy()
    expect(await screen.findByText(/JAVA_BIN/i)).toBeTruthy()
    expect(await screen.findByText('java')).toBeTruthy()
  })

  it('renders dashboard status', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ state: 'STOPPED', pid: null, uptimeMs: 0, cpu: 0, memMB: 0 }),
      headers: new Headers(),
    } as unknown as Response)

    render(wrap(<DashboardPage />))
    expect(screen.getByText(/Dashboard/i)).toBeTruthy()
  })
})
