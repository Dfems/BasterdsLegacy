import { beforeEach, describe, expect, it, vi } from 'vitest'

// These are frontend integration-ish tests that assert our fetch wrappers and endpoints are called correctly.

describe('Status and Power endpoints', () => {
  const fetchSpy = vi.spyOn(window, 'fetch')

  beforeEach(() => {
    fetchSpy.mockReset()
  })

  it('fetches /api/status', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ state: 'STOPPED', pid: null, uptimeMs: 0, cpu: 0, memMB: 0 }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/status')
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.state).toBe('STOPPED')
  })

  it('posts /api/power start/stop/restart', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
      headers: new Headers(),
    } as unknown as Response)

    let r = await fetch('/api/power', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' }),
    })
    expect(r.ok).toBe(true)

    r = await fetch('/api/power', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop' }),
    })
    expect(r.ok).toBe(true)

    r = await fetch('/api/power', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restart' }),
    })
    expect(r.ok).toBe(true)
  })
})
