import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock dependencies
vi.mock('archiver', () => ({
  default: vi.fn(() => ({
    pipe: vi.fn(),
    directory: vi.fn(),
    finalize: vi.fn(() => Promise.resolve()),
    on: vi.fn(),
  })),
}))

vi.mock('fs-extra', () => ({
  default: {
    remove: vi.fn(() => Promise.resolve()),
    copy: vi.fn(() => Promise.resolve()),
    pathExists: vi.fn(() => Promise.resolve(true)),
  },
}))

vi.mock('node:fs', () => ({
  default: {
    createWriteStream: vi.fn(() => ({
      on: vi.fn(),
    })),
    createReadStream: vi.fn(() => ({
      pipe: vi.fn(),
      on: vi.fn(),
    })),
  },
}))

vi.mock('node:fs/promises', () => ({
  default: {
    mkdir: vi.fn(() => Promise.resolve()),
    readdir: vi.fn(() => Promise.resolve([])),
    stat: vi.fn(() => Promise.resolve({ size: 1024, mtimeMs: Date.now() })),
    unlink: vi.fn(() => Promise.resolve()),
  },
}))

vi.mock('../lib/config.js', () => ({
  CONFIG: {
    MC_DIR: '/test/minecraft',
    BACKUP_DIR: '/test/backups',
    BACKUP_RETENTION_DAYS: 7,
  },
}))

vi.mock('./process.js', () => ({
  processManager: {
    state: 'STOPPED',
    stop: vi.fn(() => Promise.resolve()),
    start: vi.fn(() => Promise.resolve()),
  },
}))

describe('Backups Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listBackups', () => {
    it('lists backup files correctly', async () => {
      const mockFiles = ['backup-1.tar.gz', 'backup-2.tar.gz', 'other.txt']
      vi.mocked(fsp.readdir).mockResolvedValueOnce(mockFiles as any)

      const mockStat = { size: 2048, mtimeMs: Date.now() }
      vi.mocked(fsp.stat).mockResolvedValue(mockStat as any)

      const { listBackups } = await import('../minecraft/backups.js')
      const backups = await listBackups()

      expect(backups).toHaveLength(2) // Only .tar.gz files
      expect(backups[0]).toHaveProperty('id')
      expect(backups[0]).toHaveProperty('path')
      expect(backups[0]).toHaveProperty('size')
      expect(backups[0]).toHaveProperty('createdAt')
    })

    it('handles empty backup directory', async () => {
      vi.mocked(fsp.readdir).mockResolvedValueOnce([])

      const { listBackups } = await import('../minecraft/backups.js')
      const backups = await listBackups()

      expect(backups).toEqual([])
    })

    it('creates backup directory if not exists', async () => {
      const { listBackups } = await import('../minecraft/backups.js')
      await listBackups()

      expect(fsp.mkdir).toHaveBeenCalledWith('/test/backups', { recursive: true })
      expect(fsp.mkdir).toHaveBeenCalledWith('/test/backups/snapshots', { recursive: true })
    })

    it('sorts backups by creation time (newest first)', async () => {
      const now = Date.now()
      const mockFiles = ['old-backup.tar.gz', 'new-backup.tar.gz']

      vi.mocked(fsp.readdir).mockResolvedValueOnce(mockFiles as any)
      vi.mocked(fsp.stat)
        .mockResolvedValueOnce({ size: 1024, mtimeMs: now - 3600000 } as any) // 1 hour ago
        .mockResolvedValueOnce({ size: 2048, mtimeMs: now } as any) // now

      const { listBackups } = await import('../minecraft/backups.js')
      const backups = await listBackups()

      expect(backups[0].id).toBe('new-backup.tar.gz')
      expect(backups[1].id).toBe('old-backup.tar.gz')
    })
  })

  describe('createBackup', () => {
    it('creates full backup', async () => {
      const archiver = await import('archiver')
      const mockArchive = {
        pipe: vi.fn(),
        directory: vi.fn(),
        finalize: vi.fn(() => Promise.resolve()),
        on: vi.fn(),
      }
      vi.mocked(archiver.default).mockReturnValueOnce(mockArchive as any)

      const mockStream = { on: vi.fn() }
      vi.mocked(fs.createWriteStream).mockReturnValueOnce(mockStream as any)

      // Mock the close event to resolve the promise
      mockStream.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(callback, 10)
        }
      })

      const { createBackup } = await import('../minecraft/backups.js')
      const backup = await createBackup('full')

      expect(backup).toHaveProperty('id')
      expect(backup.id).toMatch(/full-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z\.tar\.gz/)
      expect(mockArchive.directory).toHaveBeenCalledWith(
        '/test/minecraft',
        false,
        expect.any(Function)
      )
    })

    it('creates world backup', async () => {
      const archiver = await import('archiver')
      const mockArchive = {
        pipe: vi.fn(),
        directory: vi.fn(),
        finalize: vi.fn(() => Promise.resolve()),
        on: vi.fn(),
      }
      vi.mocked(archiver.default).mockReturnValueOnce(mockArchive as any)

      const mockStream = { on: vi.fn() }
      vi.mocked(fs.createWriteStream).mockReturnValueOnce(mockStream as any)

      mockStream.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(callback, 10)
        }
      })

      const fse = await import('fs-extra')
      vi.mocked(fse.default.pathExists).mockResolvedValueOnce(true)

      const { createBackup } = await import('../minecraft/backups.js')
      const backup = await createBackup('world')

      expect(backup.id).toMatch(/world-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z\.tar\.gz/)
      expect(mockArchive.directory).toHaveBeenCalledWith('/test/minecraft/world', false)
    })

    it('throws error if world directory does not exist', async () => {
      const fse = await import('fs-extra')
      vi.mocked(fse.default.pathExists).mockResolvedValueOnce(false)

      const { createBackup } = await import('../minecraft/backups.js')

      await expect(createBackup('world')).rejects.toThrow('World directory not found')
    })

    it('stops server during backup creation', async () => {
      const { processManager } = await import('./process.js')
      const archiver = await import('archiver')

      const mockArchive = {
        pipe: vi.fn(),
        directory: vi.fn(),
        finalize: vi.fn(() => Promise.resolve()),
        on: vi.fn(),
      }
      vi.mocked(archiver.default).mockReturnValueOnce(mockArchive as any)

      const mockStream = { on: vi.fn() }
      vi.mocked(fs.createWriteStream).mockReturnValueOnce(mockStream as any)

      mockStream.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(callback, 10)
        }
      })

      processManager.state = 'RUNNING'

      const { createBackup } = await import('../minecraft/backups.js')
      await createBackup('full')

      expect(processManager.stop).toHaveBeenCalled()
      expect(processManager.start).toHaveBeenCalled()
    })
  })

  describe('restoreBackup', () => {
    it('restores backup successfully', async () => {
      const mockFiles = ['test-backup.tar.gz']
      vi.mocked(fsp.readdir).mockResolvedValueOnce(mockFiles as any)

      const fse = await import('fs-extra')
      const extractZip = await import('extract-zip')

      // Mock extract-zip
      vi.doMock('extract-zip', () => ({
        default: vi.fn(() => Promise.resolve()),
      }))

      const { restoreBackup } = await import('../minecraft/backups.js')
      await restoreBackup('test-backup.tar.gz')

      expect(fse.default.remove).toHaveBeenCalledWith('/test/minecraft')
    })

    it('throws error if backup not found', async () => {
      vi.mocked(fsp.readdir).mockResolvedValueOnce([])

      const { restoreBackup } = await import('../minecraft/backups.js')

      await expect(restoreBackup('nonexistent.tar.gz')).rejects.toThrow('Backup not found')
    })

    it('stops server before restore', async () => {
      const { processManager } = await import('./process.js')
      const mockFiles = ['test-backup.tar.gz']
      vi.mocked(fsp.readdir).mockResolvedValueOnce(mockFiles as any)

      processManager.state = 'RUNNING'

      const { restoreBackup } = await import('../minecraft/backups.js')
      await restoreBackup('test-backup.tar.gz')

      expect(processManager.stop).toHaveBeenCalled()
    })
  })

  describe('applyRetention', () => {
    it('removes old backups based on retention policy', async () => {
      const now = Date.now()
      const oldTime = now - 8 * 24 * 60 * 60 * 1000 // 8 days ago

      const mockFiles = ['old-backup.tar.gz', 'new-backup.tar.gz']
      vi.mocked(fsp.readdir).mockResolvedValueOnce(mockFiles as any)

      vi.mocked(fsp.stat)
        .mockResolvedValueOnce({ size: 1024, mtimeMs: oldTime } as any)
        .mockResolvedValueOnce({ size: 2048, mtimeMs: now } as any)

      const { applyRetention } = await import('../minecraft/backups.js')
      await applyRetention()

      expect(fsp.unlink).toHaveBeenCalledWith('/test/backups/old-backup.tar.gz')
      expect(fsp.unlink).not.toHaveBeenCalledWith('/test/backups/new-backup.tar.gz')
    })

    it('handles empty backup directory during retention', async () => {
      vi.mocked(fsp.readdir).mockResolvedValueOnce([])

      const { applyRetention } = await import('../minecraft/backups.js')
      await applyRetention()

      expect(fsp.unlink).not.toHaveBeenCalled()
    })

    it('logs retention actions', async () => {
      const now = Date.now()
      const oldTime = now - 8 * 24 * 60 * 60 * 1000

      const mockFiles = ['old-backup.tar.gz']
      vi.mocked(fsp.readdir).mockResolvedValueOnce(mockFiles as any)
      vi.mocked(fsp.stat).mockResolvedValueOnce({ size: 1024, mtimeMs: oldTime } as any)

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const { applyRetention } = await import('../minecraft/backups.js')
      await applyRetention()

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Removing old backup'))
      consoleSpy.mockRestore()
    })
  })
})
