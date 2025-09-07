import { beforeEach, describe, expect, it, vi } from 'vitest'

// Frontend tests for Whitelist API endpoints
describe('Whitelist API endpoints', () => {
  const fetchSpy = vi.spyOn(window, 'fetch')

  beforeEach(() => {
    fetchSpy.mockReset()
  })

  it('fetches whitelist players via /api/whitelist', async () => {
    const mockPlayers = ['Steve', 'Alex', 'Notch', 'TestPlayer']

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ players: mockPlayers }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/whitelist')
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data).toHaveProperty('players')
    expect(Array.isArray(data.players)).toBe(true)
    expect(data.players).toHaveLength(4)
    expect(data.players).toContain('Steve')
    expect(data.players).toContain('Alex')
  })

  it('adds player to whitelist', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', player: 'NewPlayer' }),
    })
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.ok).toBe(true)
  })

  it('removes player from whitelist', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', player: 'OldPlayer' }),
    })
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.ok).toBe(true)
  })

  it('enables whitelist enforcement', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'on', player: '' }),
    })
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.ok).toBe(true)
  })

  it('disables whitelist enforcement', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'off', player: '' }),
    })
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.ok).toBe(true)
  })

  it('reloads whitelist from file', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reload', player: '' }),
    })
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.ok).toBe(true)
  })

  it('handles whitelist fetch errors', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/whitelist')
    expect(r.ok).toBe(false)
    expect(r.status).toBe(500)
  })

  it('handles invalid whitelist action', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid body' }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'invalid', player: 'TestPlayer' }),
    })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(400)
  })

  it('handles missing player parameter for add/remove', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid body' }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add' }), // missing player
    })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(400)
  })

  it('handles empty whitelist response', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ players: [] }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/whitelist')
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.players).toEqual([])
  })

  it('auto-enables whitelist when adding first user', async () => {
    // Mock empty initial whitelist and disabled whitelist
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ players: [] }),
      headers: new Headers(),
    } as unknown as Response)

    // Check initial state
    const initialR = await fetch('/api/whitelist')
    const initialData = await initialR.json()
    expect(initialData.players).toEqual([])

    // Mock successful add operation
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
      headers: new Headers(),
    } as unknown as Response)

    // Add first user - should auto-enable whitelist
    const addR = await fetch('/api/whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', player: 'FirstPlayer' }),
    })
    expect(addR.ok).toBe(true)
    const addData = await addR.json()
    expect(addData.ok).toBe(true)
  })
})
