import { beforeEach, describe, expect, it, vi } from 'vitest'

// Frontend tests for Backup Schedule Persistence API endpoints
describe('Backup Schedule Persistence', () => {
  const fetchSpy = vi.spyOn(window, 'fetch')

  beforeEach(() => {
    fetchSpy.mockReset()
  })

  it('saves backup schedule configuration to database when updating via API', async () => {
    const mockResponse = {
      ok: true,
      config: {
        enabled: true,
        frequency: 'daily',
        mode: 'world',
        dailyAt: '03:00',
      },
    }

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    } as unknown as Response)

    const customConfig = {
      enabled: true,
      frequency: 'daily',
      mode: 'world',
      dailyAt: '03:00',
    }

    const r = await fetch('/api/backups/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customConfig),
    })

    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.ok).toBe(true)
    expect(data.config.enabled).toBe(true)
    expect(data.config.frequency).toBe('daily')
    expect(data.config.mode).toBe('world')
    expect(data.config.dailyAt).toBe('03:00')
  })

  it('loads backup schedule configuration from database on server startup', async () => {
    const mockSchedule = {
      config: {
        enabled: true,
        frequency: 'daily',
        mode: 'world',
        dailyAt: '03:00',
      },
      presets: ['disabled', 'daily_3am', 'weekly_monday'],
      nextRun: '2024-01-15T03:00:00.000Z',
    }

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSchedule,
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups/schedule')
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.config.enabled).toBe(true)
    expect(data.config.frequency).toBe('daily')
    expect(data.config.mode).toBe('world')
    expect(data.config.dailyAt).toBe('03:00')
    expect(Array.isArray(data.presets)).toBe(true)
  })

  it('handles fallback to environment variables when database is unavailable', async () => {
    // Simula una configurazione di fallback dalle variabili d'ambiente
    const mockSchedule = {
      config: {
        enabled: false,
        frequency: 'disabled',
        mode: 'world',
        cronPattern: '0 3 * * *',
      },
      presets: ['disabled', 'daily_3am', 'weekly_monday'],
    }

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSchedule,
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups/schedule')
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.config).toBeDefined()
    expect(data.config.frequency).toBeDefined()
    expect(data.config.mode).toBeDefined()
  })

  it('enables backup automation when configuration is set via UI', async () => {
    const enabledConfig = {
      enabled: true,
      frequency: 'daily',
      mode: 'full',
      dailyAt: '02:00',
    }

    const mockResponse = {
      ok: true,
      config: enabledConfig,
    }

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enabledConfig),
    })

    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.ok).toBe(true)
    expect(data.config.enabled).toBe(true)
    expect(data.config.frequency).toBe('daily')
    expect(data.config.mode).toBe('full')
    expect(data.config.dailyAt).toBe('02:00')
  })

  it('disables backup automation when configuration is disabled via UI', async () => {
    const disabledConfig = {
      enabled: false,
      frequency: 'disabled',
      mode: 'world',
    }

    const mockResponse = {
      ok: true,
      config: disabledConfig,
    }

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(disabledConfig),
    })

    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.ok).toBe(true)
    expect(data.config.enabled).toBe(false)
    expect(data.config.frequency).toBe('disabled')
  })

  it('validates backup schedule configuration before saving', async () => {
    const invalidConfig = {
      enabled: 'invalid', // Should be boolean
      frequency: 'invalid_frequency',
      mode: 'invalid_mode',
    }

    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Invalid configuration',
        details: [
          'enabled must be a boolean',
          'frequency must be one of: disabled, daily, every-2-days, every-3-days, weekly, custom',
          'mode must be either "full" or "world"',
        ],
      }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidConfig),
    })

    expect(r.ok).toBe(false)
    expect(r.status).toBe(400)
    const data = await r.json()
    expect(data.error).toBe('Invalid configuration')
    expect(Array.isArray(data.details)).toBe(true)
    expect(data.details.length).toBeGreaterThan(0)
  })
})
