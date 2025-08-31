import type { JSX } from 'react'

import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardPage from '../pages/DashboardPage'
import SettingsPage from '../pages/SettingsPage'

// Removed fake timers
// vi.useFakeTimers()

describe('Settings and Dashboard render basics', () => {
  const fetchSpy = vi.spyOn(window, 'fetch')
  const system = createSystem(defaultConfig, {})
  const wrap = (ui: JSX.Element) => <ChakraProvider value={system}>{ui}</ChakraProvider>

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
    // titolo campo statico e valore da fetch mockato
    expect(screen.getByText(/Settings/i)).toBeInTheDocument()
    expect(await screen.findByText(/JAVA_BIN/i)).toBeInTheDocument()
    expect(await screen.findByText('java')).toBeInTheDocument()
  })

  it('renders dashboard status', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ state: 'STOPPED', pid: null, uptimeMs: 0, cpu: 0, memMB: 0 }),
      headers: new Headers(),
    } as unknown as Response)

    render(wrap(<DashboardPage />))
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
  })
})
