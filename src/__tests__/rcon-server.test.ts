import { beforeEach, describe, expect, it, vi } from 'vitest'

// Frontend tests for RCON and Server management endpoints
describe('RCON and Server management', () => {
  const fetchSpy = vi.spyOn(window, 'fetch')

  beforeEach(() => {
    fetchSpy.mockReset()
  })

  describe('RCON functionality', () => {
    it('executes RCON command via /api/rcon', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'There are 0/20 players online:' }),
        headers: new Headers(),
      } as unknown as Response)

      const r = await fetch('/api/rcon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'list' }),
      })
      expect(r.ok).toBe(true)
      const data = await r.json()
      expect(data).toHaveProperty('response')
      expect(typeof data.response).toBe('string')
    })

    it('handles RCON disabled error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: 'RCON disabled' }),
        headers: new Headers(),
      } as unknown as Response)

      const r = await fetch('/api/rcon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'help' }),
      })
      expect(r.ok).toBe(false)
      expect(r.status).toBe(503)
    })

    it('handles RCON connection error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'RCON connection failed' }),
        headers: new Headers(),
      } as unknown as Response)

      const r = await fetch('/api/rcon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'say Hello' }),
      })
      expect(r.ok).toBe(false)
      expect(r.status).toBe(500)
    })

    it('validates RCON command format', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid command' }),
        headers: new Headers(),
      } as unknown as Response)

      const r = await fetch('/api/rcon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // missing command
      })
      expect(r.ok).toBe(false)
      expect(r.status).toBe(400)
    })
  })

  describe('File management', () => {
    it('lists files via /api/files', async () => {
      const mockFiles = [
        { name: 'server.properties', type: 'file', size: 1024, modified: Date.now() },
        { name: 'world', type: 'directory', size: 0, modified: Date.now() },
        { name: 'plugins', type: 'directory', size: 0, modified: Date.now() },
      ]

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: mockFiles }),
        headers: new Headers(),
      } as unknown as Response)

      const r = await fetch('/api/files?path=/')
      expect(r.ok).toBe(true)
      const data = await r.json()
      expect(data).toHaveProperty('files')
      expect(Array.isArray(data.files)).toBe(true)
      expect(data.files).toHaveLength(3)
    })

    it('deletes file via /api/files DELETE', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
        headers: new Headers(),
      } as unknown as Response)

      const r = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/logs/old.log' }),
      })
      expect(r.ok).toBe(true)
      const data = await r.json()
      expect(data.ok).toBe(true)
    })

    it('uploads file via /api/files/upload', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, uploaded: 'config.yml' }),
        headers: new Headers(),
      } as unknown as Response)

      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt')
      formData.append('path', '/plugins/')

      const r = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })
      expect(r.ok).toBe(true)
      const data = await r.json()
      expect(data.ok).toBe(true)
    })

    it('downloads file via /api/files/download', async () => {
      const mockFileContent = 'server-port=25565\nserver-name=My Server'

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: async () => mockFileContent,
        headers: new Headers({
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename="server.properties"',
        }),
      } as unknown as Response)

      const r = await fetch('/api/files/download?path=/server.properties')
      expect(r.ok).toBe(true)
      const content = await r.text()
      expect(content).toBe(mockFileContent)
    })
  })

  describe('Server deletion', () => {
    it('deletes server with retention via /api/server/delete', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, retainedFiles: ['world/', 'config/'] }),
        headers: new Headers(),
      } as unknown as Response)

      const r = await fetch('/api/server/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepBackups: true, retainWorld: true }),
      })
      expect(r.ok).toBe(true)
      const data = await r.json()
      expect(data.ok).toBe(true)
      expect(data).toHaveProperty('retainedFiles')
    })

    it('deletes server completely via /api/server/delete', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, deletedFiles: 42 }),
        headers: new Headers(),
      } as unknown as Response)

      const r = await fetch('/api/server/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepBackups: false, retainWorld: false }),
      })
      expect(r.ok).toBe(true)
      const data = await r.json()
      expect(data.ok).toBe(true)
      expect(data).toHaveProperty('deletedFiles')
    })

    it('handles server deletion errors', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Cannot delete running server' }),
        headers: new Headers(),
      } as unknown as Response)

      const r = await fetch('/api/server/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepBackups: false, retainWorld: false }),
      })
      expect(r.ok).toBe(false)
      expect(r.status).toBe(409)
    })
  })

  describe('Process monitoring', () => {
    it('fetches server health via /api/health', async () => {
      const mockHealth = {
        status: 'healthy',
        uptime: 3600000,
        cpu: 45.2,
        memory: { used: 2048, total: 4096 },
        disk: { used: 15360, total: 51200 },
        players: { online: 3, max: 20 },
      }

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth,
        headers: new Headers(),
      } as unknown as Response)

      const r = await fetch('/api/health')
      expect(r.ok).toBe(true)
      const data = await r.json()
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('uptime')
      expect(data).toHaveProperty('cpu')
      expect(data).toHaveProperty('memory')
    })

    it('fetches detailed system metrics via /api/metrics', async () => {
      const mockMetrics = {
        timestamp: Date.now(),
        server: {
          state: 'RUNNING',
          pid: 12345,
          cpu: 42.5,
          memory: 2048,
        },
        system: {
          loadAvg: [1.2, 1.5, 1.8],
          freeMemory: 2048,
          totalMemory: 8192,
        },
      }

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics,
        headers: new Headers(),
      } as unknown as Response)

      const r = await fetch('/api/metrics')
      expect(r.ok).toBe(true)
      const data = await r.json()
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('server')
      expect(data).toHaveProperty('system')
    })
  })
})
