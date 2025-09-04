import fsp from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock dependencies
vi.mock('node:fs/promises', () => ({
  default: {
    mkdir: vi.fn(),
    appendFile: vi.fn(),
    stat: vi.fn(),
    rename: vi.fn(),
    readFile: vi.fn(),
  },
}))

vi.mock('../lib/config.js', () => ({
  CONFIG: {
    MC_DIR: '/test/minecraft',
  },
}))

describe('Logs Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('appendLog', () => {
    it('appends log entry to latest.log file', async () => {
      const { appendLog } = await import('../minecraft/logs.js')

      const logEvent = {
        ts: Date.now(),
        line: '[INFO] Server started successfully',
      }

      appendLog(logEvent)

      // Wait for async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(fsp.mkdir).toHaveBeenCalledWith('/test/minecraft/logs', { recursive: true })
      expect(fsp.appendFile).toHaveBeenCalledWith(
        '/test/minecraft/logs/latest.log',
        expect.stringContaining('[INFO] Server started successfully'),
        'utf8'
      )
    })

    it('formats log entry with ISO timestamp', async () => {
      const { appendLog } = await import('../minecraft/logs.js')

      const testTime = new Date('2024-01-15T10:30:00.000Z').getTime()
      const logEvent = {
        ts: testTime,
        line: '[DEBUG] Test message',
      }

      appendLog(logEvent)
      await new Promise((resolve) => setTimeout(resolve, 10))

      const expectedLine = '2024-01-15T10:30:00.000Z [DEBUG] Test message\n'
      expect(fsp.appendFile).toHaveBeenCalledWith(
        '/test/minecraft/logs/latest.log',
        expectedLine,
        'utf8'
      )
    })

    it('ensures log directory exists before appending', async () => {
      const { appendLog } = await import('../minecraft/logs.js')

      const logEvent = { ts: Date.now(), line: 'Test log' }
      appendLog(logEvent)

      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(fsp.mkdir).toHaveBeenCalledBefore(fsp.appendFile as any)
    })

    it('handles multiple concurrent log appends', async () => {
      const { appendLog } = await import('../minecraft/logs.js')

      const events = [
        { ts: Date.now(), line: 'Log 1' },
        { ts: Date.now() + 1, line: 'Log 2' },
        { ts: Date.now() + 2, line: 'Log 3' },
      ]

      // Append all logs concurrently
      events.forEach(appendLog)

      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(fsp.appendFile).toHaveBeenCalledTimes(3)
    })
  })

  describe('rotateIfNeeded', () => {
    it('rotates log when day has changed', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      vi.mocked(fsp.stat).mockResolvedValue({
        mtime: yesterday,
      } as any)

      const { rotateIfNeeded } = await import('../minecraft/logs.js')
      await rotateIfNeeded()

      expect(fsp.rename).toHaveBeenCalledWith(
        '/test/minecraft/logs/latest.log',
        expect.stringMatching(/\/test\/minecraft\/logs\/server-\d{4}-\d{2}-\d{2}\.log/)
      )
    })

    it('does not rotate log when day has not changed', async () => {
      const today = new Date()

      vi.mocked(fsp.stat).mockResolvedValue({
        mtime: today,
      } as any)

      const { rotateIfNeeded } = await import('../minecraft/logs.js')
      await rotateIfNeeded()

      expect(fsp.rename).not.toHaveBeenCalled()
    })

    it('handles missing log file gracefully', async () => {
      vi.mocked(fsp.stat).mockRejectedValue(new Error('ENOENT: file not found'))

      const { rotateIfNeeded } = await import('../minecraft/logs.js')

      await expect(rotateIfNeeded()).resolves.toBeUndefined()
      expect(fsp.rename).not.toHaveBeenCalled()
    })

    it('creates log directory before rotation check', async () => {
      const { rotateIfNeeded } = await import('../minecraft/logs.js')
      await rotateIfNeeded()

      expect(fsp.mkdir).toHaveBeenCalledWith('/test/minecraft/logs', { recursive: true })
    })

    it('generates correct archive filename', async () => {
      const testDate = new Date('2024-01-15T10:30:00.000Z')

      vi.mocked(fsp.stat).mockResolvedValue({
        mtime: testDate,
      } as any)

      const { rotateIfNeeded } = await import('../minecraft/logs.js')
      await rotateIfNeeded()

      expect(fsp.rename).toHaveBeenCalledWith(
        '/test/minecraft/logs/latest.log',
        '/test/minecraft/logs/server-2024-01-15.log'
      )
    })
  })

  describe('readLogs', () => {
    it('reads logs from latest.log file', async () => {
      const mockLogContent =
        '2024-01-15T10:30:00.000Z [INFO] Server started\n2024-01-15T10:31:00.000Z [INFO] Player joined'
      vi.mocked(fsp.readFile).mockResolvedValue(mockLogContent)

      const { readLogs } = await import('../minecraft/logs.js')
      const result = await readLogs()

      expect(fsp.readFile).toHaveBeenCalledWith('/test/minecraft/logs/latest.log', 'utf8')
      expect(result.lines).toHaveLength(2)
      expect(result.lines[0]).toContain('[INFO] Server started')
      expect(result.lines[1]).toContain('[INFO] Player joined')
    })

    it('handles missing log file', async () => {
      vi.mocked(fsp.readFile).mockRejectedValue(new Error('ENOENT'))

      const { readLogs } = await import('../minecraft/logs.js')
      const result = await readLogs()

      expect(result.lines).toEqual([])
      expect(result.nextCursor).toBeUndefined()
    })

    it('filters logs by cursor timestamp', async () => {
      const mockLogContent =
        '2024-01-15T10:30:00.000Z [INFO] Old log\n' + '2024-01-15T10:35:00.000Z [INFO] New log'

      vi.mocked(fsp.readFile).mockResolvedValue(mockLogContent)

      const cursorTime = new Date('2024-01-15T10:32:00.000Z').getTime()

      const { readLogs } = await import('../minecraft/logs.js')
      const result = await readLogs(cursorTime)

      expect(result.lines).toHaveLength(1)
      expect(result.lines[0]).toContain('[INFO] New log')
    })

    it('limits number of returned logs', async () => {
      const mockLogs = Array.from(
        { length: 10 },
        (_, i) => `2024-01-15T10:${30 + i}:00.000Z [INFO] Log ${i}`
      ).join('\n')

      vi.mocked(fsp.readFile).mockResolvedValue(mockLogs)

      const { readLogs } = await import('../minecraft/logs.js')
      const result = await readLogs(undefined, 5)

      expect(result.lines).toHaveLength(5)
      // Should return the last 5 logs
      expect(result.lines[0]).toContain('Log 5')
      expect(result.lines[4]).toContain('Log 9')
    })

    it('returns next cursor for pagination', async () => {
      const mockLogContent = '2024-01-15T10:30:00.000Z [INFO] Test log'
      vi.mocked(fsp.readFile).mockResolvedValue(mockLogContent)

      const { readLogs } = await import('../minecraft/logs.js')
      const result = await readLogs()

      expect(result.nextCursor).toBe(new Date('2024-01-15T10:30:00.000Z').getTime())
    })

    it('handles empty log file', async () => {
      vi.mocked(fsp.readFile).mockResolvedValue('')

      const { readLogs } = await import('../minecraft/logs.js')
      const result = await readLogs()

      expect(result.lines).toEqual([])
      expect(result.nextCursor).toBeUndefined()
    })

    it('filters out empty lines', async () => {
      const mockLogContent =
        '2024-01-15T10:30:00.000Z [INFO] Log 1\n\n\n2024-01-15T10:31:00.000Z [INFO] Log 2\n'
      vi.mocked(fsp.readFile).mockResolvedValue(mockLogContent)

      const { readLogs } = await import('../minecraft/logs.js')
      const result = await readLogs()

      expect(result.lines).toHaveLength(2)
    })

    it('handles malformed timestamp lines gracefully', async () => {
      const mockLogContent =
        '2024-01-15T10:30:00.000Z [INFO] Valid log\n' +
        'Invalid timestamp line\n' +
        '2024-01-15T10:31:00.000Z [INFO] Another valid log'

      vi.mocked(fsp.readFile).mockResolvedValue(mockLogContent)

      const { readLogs } = await import('../minecraft/logs.js')
      const result = await readLogs()

      expect(result.lines).toHaveLength(3) // All lines returned, malformed ones handled gracefully
    })

    it('creates log directory before reading', async () => {
      vi.mocked(fsp.readFile).mockResolvedValue('')

      const { readLogs } = await import('../minecraft/logs.js')
      await readLogs()

      expect(fsp.mkdir).toHaveBeenCalledWith('/test/minecraft/logs', { recursive: true })
    })

    it('handles cursor filtering with invalid timestamps', async () => {
      const mockLogContent =
        'invalid timestamp line\n' + '2024-01-15T10:31:00.000Z [INFO] Valid log'

      vi.mocked(fsp.readFile).mockResolvedValue(mockLogContent)

      const cursorTime = new Date('2024-01-15T10:30:00.000Z').getTime()

      const { readLogs } = await import('../minecraft/logs.js')
      const result = await readLogs(cursorTime)

      expect(result.lines).toHaveLength(1)
      expect(result.lines[0]).toContain('[INFO] Valid log')
    })
  })
})
