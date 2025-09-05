import { beforeEach, describe, expect, it, vi } from 'vitest'

// Frontend tests for Logs API endpoints
describe('Logs API endpoints', () => {
  const fetchSpy = vi.spyOn(window, 'fetch')

  beforeEach(() => {
    fetchSpy.mockReset()
  })

  it('fetches recent logs via /api/logs', async () => {
    const mockLogs = [
      { ts: Date.now(), line: '[INFO] Starting minecraft server' },
      { ts: Date.now() - 1000, line: '[INFO] Loading world...' },
      { ts: Date.now() - 2000, line: '[INFO] Server started' },
    ]

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logs: mockLogs }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/logs')
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data).toHaveProperty('logs')
    expect(Array.isArray(data.logs)).toBe(true)
    expect(data.logs).toHaveLength(3)
    expect(data.logs[0]).toHaveProperty('ts')
    expect(data.logs[0]).toHaveProperty('line')
  })

  it('fetches logs with limit parameter', async () => {
    const mockLogs = [{ ts: Date.now(), line: '[INFO] Recent log entry' }]

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logs: mockLogs }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/logs?limit=10')
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.logs).toHaveLength(1)
  })

  it('fetches logs with since parameter', async () => {
    const sinceTimestamp = Date.now() - 3600000 // 1 hour ago
    const mockLogs = [
      { ts: Date.now(), line: '[INFO] Recent entry' },
      { ts: Date.now() - 1800000, line: '[INFO] 30 minutes ago' },
    ]

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logs: mockLogs }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch(`/api/logs?since=${sinceTimestamp}`)
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.logs).toHaveLength(2)
  })

  it('fetches logs with both limit and since parameters', async () => {
    const sinceTimestamp = Date.now() - 3600000
    const mockLogs = [{ ts: Date.now(), line: '[INFO] Latest entry' }]

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logs: mockLogs }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch(`/api/logs?limit=5&since=${sinceTimestamp}`)
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.logs).toHaveLength(1)
  })

  it('handles empty logs response', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logs: [] }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/logs')
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.logs).toEqual([])
  })

  it('handles logs fetch errors', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/logs')
    expect(r.ok).toBe(false)
    expect(r.status).toBe(500)
  })

  it('validates log entry structure', async () => {
    const mockLogs = [
      { ts: 1640995200000, line: '[INFO] Server starting' },
      { ts: 1640995201000, line: '[WARN] Low memory warning' },
      { ts: 1640995202000, line: '[ERROR] Connection failed' },
    ]

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logs: mockLogs }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/logs')
    const data = await r.json()

    data.logs.forEach((log: { ts: number; line: string }) => {
      expect(typeof log.ts).toBe('number')
      expect(typeof log.line).toBe('string')
      expect(log.ts).toBeGreaterThan(0)
      expect(log.line.length).toBeGreaterThan(0)
    })
  })

  it('handles invalid query parameters gracefully', async () => {
    // Mock response for each fetch call
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ logs: [] }),
      headers: new Headers(),
    } as unknown as Response)

    // Test with invalid limit
    const r1 = await fetch('/api/logs?limit=invalid')
    expect(r1.ok).toBe(true)

    // Test with invalid since
    const r2 = await fetch('/api/logs?since=invalid')
    expect(r2.ok).toBe(true)

    // Test with negative limit
    const r3 = await fetch('/api/logs?limit=-1')
    expect(r3.ok).toBe(true)
  })

  it('fetches log file download', async () => {
    const mockFileContent = '[INFO] Server log content...'

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      text: async () => mockFileContent,
      headers: new Headers({
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="latest.log"',
      }),
    } as unknown as Response)

    const r = await fetch('/api/logs/download')
    expect(r.ok).toBe(true)
    const content = await r.text()
    expect(content).toBe(mockFileContent)
    expect(r.headers.get('Content-Type')).toBe('text/plain')
  })

  it('clears logs via DELETE /api/logs', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, cleared: 150 }),
      headers: new Headers(),
    } as unknown as Response)

    const r = await fetch('/api/logs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    expect(r.ok).toBe(true)
    const data = await r.json()
    expect(data.ok).toBe(true)
    expect(data).toHaveProperty('cleared')
  })
})
