import { beforeEach, describe, expect, it, vi } from 'vitest'

// Frontend tests for Backups API endpoints
describe('Backups API endpoints', () => {
  const fetchSpy = vi.spyOn(window, 'fetch')

  beforeEach(() => {
    fetchSpy.mockReset()
  })

  it('fetches backup list via /api/backups', async () => {
    const mockBackups = [
      { id: 'backup-1', timestamp: Date.now(), mode: 'full', sizeMB: 150 },
      { id: 'backup-2', timestamp: Date.now() - 86400000, mode: 'world', sizeMB: 75 },
    ]

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBackups,
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups')
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(2)
    expect(data[0]).toHaveProperty('id')
    expect(data[0]).toHaveProperty('mode')
  })

  it('creates full backup via /api/backups', async () => {
    const mockBackup = { id: 'backup-new', timestamp: Date.now(), mode: 'full', sizeMB: 200 }

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBackup,
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'full' }),
    })
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.mode).toBe('full')
    expect(data).toHaveProperty('id')
  })

  it('creates world backup via /api/backups', async () => {
    const mockBackup = { id: 'backup-world', timestamp: Date.now(), mode: 'world', sizeMB: 80 }

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBackup,
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'world' }),
    })
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.mode).toBe('world')
    expect(data).toHaveProperty('id')
  })

  it('restores backup via /api/backups/:id/restore', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
      headers: new Headers(),
    } as unknown as Response)

    const backupId = 'backup-123'
    const r = await fetch(`/api/backups/${backupId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.ok).toBe(true)
  })

  it('handles backup creation errors', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid mode. Must be "full" or "world"' }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'invalid' }),
    })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(400)
  })

  it('handles backup restore errors', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Backup not found' }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups/nonexistent/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(404)
  })

  it('handles backup creation with missing mode', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid mode. Must be "full" or "world"' }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(400)
  })

  it('handles backup restore with missing ID', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Missing or invalid backup ID' }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups//restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(400)
  })

  it('handles server errors during backup listing', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Failed to list backups' }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups')
    expect(r.ok).toBe(false)
    expect(r.status).toBe(500)
  })

  it('handles server errors during backup creation', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Backup creation failed: Source directory not found' }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'world' }),
    })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(500)
  })
})

// Tests for Automatic Backup Schedule API endpoints
describe('Automatic Backup Schedule API endpoints', () => {
  const fetchSpy = vi.spyOn(window, 'fetch')

  beforeEach(() => {
    fetchSpy.mockReset()
  })

  it('fetches current backup schedule via /api/backups/schedule', async () => {
    const mockSchedule = {
      enabled: false,
      frequency: 'disabled',
      mode: 'world',
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
    expect(data).toHaveProperty('enabled')
    expect(data).toHaveProperty('frequency')
    expect(data).toHaveProperty('mode')
    expect(data).toHaveProperty('presets')
    expect(Array.isArray(data.presets)).toBe(true)
  })

  it('updates backup schedule with preset via /api/backups/schedule', async () => {
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

    const r = await fetch('/api/backups/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset: 'daily_3am' }),
    })
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.ok).toBe(true)
    expect(data.config.enabled).toBe(true)
    expect(data.config.frequency).toBe('daily')
  })

  it('updates backup schedule with custom configuration via /api/backups/schedule', async () => {
    const customConfig = {
      enabled: true,
      frequency: 'custom',
      mode: 'full',
      cronPattern: '0 2 * * 1,3,5', // Lunedì, mercoledì, venerdì alle 2:00
    }

    const mockResponse = {
      ok: true,
      config: customConfig,
    }

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customConfig),
    })
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.ok).toBe(true)
    expect(data.config.frequency).toBe('custom')
    expect(data.config.cronPattern).toBe('0 2 * * 1,3,5')
  })

  it('fetches available presets via /api/backups/presets', async () => {
    const mockPresets = {
      presets: [
        { id: 'disabled', name: 'Disabled', enabled: false, frequency: 'disabled' },
        { id: 'daily_3am', name: 'Daily 3am', enabled: true, frequency: 'daily', mode: 'world', dailyAt: '03:00' },
        { id: 'weekly_monday', name: 'Weekly Monday', enabled: true, frequency: 'weekly', mode: 'full', weeklyOn: 1, dailyAt: '03:00' },
      ],
    }

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPresets,
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups/presets')
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data).toHaveProperty('presets')
    expect(Array.isArray(data.presets)).toBe(true)
    expect(data.presets).toHaveLength(3)
    expect(data.presets[0]).toHaveProperty('id')
    expect(data.presets[0]).toHaveProperty('name')
  })

  it('handles invalid preset error via /api/backups/schedule', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid preset. Available presets: disabled, daily_3am, weekly_monday' }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset: 'nonexistent' }),
    })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(400)
  })

  it('handles validation errors for custom configuration via /api/backups/schedule', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Invalid configuration',
        details: ['enabled must be a boolean', 'mode must be either "full" or "world"'],
      }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled: 'invalid',
        frequency: 'daily',
        mode: 'invalid',
      }),
    })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(400)
    const data = await r.json()
    expect(data.error).toBe('Invalid configuration')
    expect(Array.isArray(data.details)).toBe(true)
  })

  it('handles server errors during schedule update via /api/backups/schedule', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Failed to update backup schedule' }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset: 'daily_3am' }),
    })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(500)
  })

  it('handles server errors during presets fetch via /api/backups/presets', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Failed to get backup presets' }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/backups/presets')
    expect(r.ok).toBe(false)
    expect(r.status).toBe(500)
  })
})
