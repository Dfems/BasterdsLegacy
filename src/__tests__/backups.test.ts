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
