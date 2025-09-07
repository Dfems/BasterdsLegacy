import fsp from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Import dopo i mock
import { rconEnabled, rconExec } from '../../server/src/minecraft/rcon.js'
import {
  isWhitelistEnabled,
  setWhitelistEnabled,
} from '../../server/src/minecraft/serverProperties.js'
import { listWhitelist, updateWhitelist } from '../../server/src/minecraft/whitelist.js'

// Mock moduli prima degli import
vi.mock('node:fs/promises')
vi.mock('../../server/src/lib/config.js', () => ({
  CONFIG: { MC_DIR: '/test/minecraft' },
}))
vi.mock('../../server/src/minecraft/rcon.js', () => ({
  rconEnabled: vi.fn(),
  rconExec: vi.fn(),
}))
vi.mock('../../server/src/minecraft/serverProperties.js', () => ({
  isWhitelistEnabled: vi.fn(),
  setWhitelistEnabled: vi.fn(),
}))

const mockFsp = vi.mocked(fsp)
const mockRconEnabled = vi.mocked(rconEnabled)
const mockRconExec = vi.mocked(rconExec)
const mockIsWhitelistEnabled = vi.mocked(isWhitelistEnabled)
const mockSetWhitelistEnabled = vi.mocked(setWhitelistEnabled)

describe('Whitelist Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Auto-enable whitelist functionality', () => {
    it('enables whitelist in server.properties when adding first user without RCON', async () => {
      // Setup: RCON disabled, whitelist initially disabled
      mockRconEnabled.mockReturnValue(false)
      mockIsWhitelistEnabled.mockResolvedValue(false)

      // Mock empty whitelist file initially
      mockFsp.readFile.mockRejectedValue(new Error('File not found'))
      mockFsp.writeFile.mockResolvedValue()
      mockFsp.mkdir.mockResolvedValue(undefined)

      // Add first user
      await updateWhitelist('add', 'TestPlayer')

      // Verify whitelist was enabled
      expect(mockIsWhitelistEnabled).toHaveBeenCalled()
      expect(mockSetWhitelistEnabled).toHaveBeenCalledWith(true)

      // Verify whitelist.json was created with the user
      expect(mockFsp.mkdir).toHaveBeenCalled()
      expect(mockFsp.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('whitelist.json'),
        expect.stringContaining('TestPlayer'),
        'utf8'
      )
    })

    it('does not enable whitelist when already enabled', async () => {
      // Setup: RCON disabled, whitelist already enabled
      mockRconEnabled.mockReturnValue(false)
      mockIsWhitelistEnabled.mockResolvedValue(true)
      mockFsp.readFile.mockResolvedValue('[]')
      mockFsp.writeFile.mockResolvedValue()

      // Add user
      await updateWhitelist('add', 'TestPlayer')

      // Verify whitelist enable was checked but not called
      expect(mockIsWhitelistEnabled).toHaveBeenCalled()
      expect(mockSetWhitelistEnabled).not.toHaveBeenCalled()
    })

    it('enables whitelist via RCON when available', async () => {
      // Setup: RCON enabled, whitelist initially disabled
      mockRconEnabled.mockReturnValue(true)
      mockIsWhitelistEnabled.mockResolvedValue(false)

      // Add user
      await updateWhitelist('add', 'TestPlayer')

      // Verify whitelist was enabled both in properties and via RCON
      expect(mockIsWhitelistEnabled).toHaveBeenCalled()
      expect(mockSetWhitelistEnabled).toHaveBeenCalledWith(true)
      expect(mockRconExec).toHaveBeenCalledWith('whitelist on')
      expect(mockRconExec).toHaveBeenCalledWith('whitelist add TestPlayer')
    })

    it('handles RCON errors gracefully when enabling whitelist', async () => {
      // Setup: RCON enabled but fails
      mockRconEnabled.mockReturnValue(true)
      mockIsWhitelistEnabled.mockResolvedValue(false)

      // Mock RCON to fail on whitelist on command
      mockRconExec.mockImplementation((cmd) => {
        if (cmd === 'whitelist on') {
          throw new Error('RCON connection failed')
        }
        return Promise.resolve('OK')
      })

      // Add user - should not throw even if RCON fails
      await expect(updateWhitelist('add', 'TestPlayer')).resolves.not.toThrow()

      // Verify properties were still updated
      expect(mockSetWhitelistEnabled).toHaveBeenCalledWith(true)
      expect(mockRconExec).toHaveBeenCalledWith('whitelist add TestPlayer')
    })
  })

  describe('Whitelist control actions', () => {
    it('handles whitelist on action', async () => {
      mockRconEnabled.mockReturnValue(true)
      mockRconExec.mockResolvedValue('OK') // Reset the mock

      await updateWhitelist('on', '')

      expect(mockSetWhitelistEnabled).toHaveBeenCalledWith(true)
      expect(mockRconExec).toHaveBeenCalledWith('whitelist on')
    })

    it('handles whitelist off action', async () => {
      mockRconEnabled.mockReturnValue(true)
      mockRconExec.mockResolvedValue('OK') // Reset the mock

      await updateWhitelist('off', '')

      expect(mockSetWhitelistEnabled).toHaveBeenCalledWith(false)
      expect(mockRconExec).toHaveBeenCalledWith('whitelist off')
    })

    it('handles whitelist reload action', async () => {
      mockRconEnabled.mockReturnValue(true)
      mockRconExec.mockResolvedValue('OK') // Reset the mock

      await updateWhitelist('reload', '')

      expect(mockRconExec).toHaveBeenCalledWith('whitelist reload')
      // Should not touch server.properties for reload
      expect(mockSetWhitelistEnabled).not.toHaveBeenCalled()
    })

    it('handles actions without RCON', async () => {
      mockRconEnabled.mockReturnValue(false)
      mockRconExec.mockResolvedValue('OK') // Reset the mock

      await updateWhitelist('on', '')
      await updateWhitelist('off', '')
      await updateWhitelist('reload', '')

      // Only on/off should affect server.properties
      expect(mockSetWhitelistEnabled).toHaveBeenCalledWith(true)
      expect(mockSetWhitelistEnabled).toHaveBeenCalledWith(false)
      expect(mockRconExec).not.toHaveBeenCalled()
    })
  })

  describe('List whitelist functionality', () => {
    it('lists whitelist via RCON when available', async () => {
      mockRconEnabled.mockReturnValue(true)
      mockRconExec.mockResolvedValue('There are 2 whitelisted players: Steve, Alex')

      const players = await listWhitelist()

      expect(players).toEqual(['Steve', 'Alex'])
      expect(mockRconExec).toHaveBeenCalledWith('whitelist list')
    })

    it('lists whitelist from file when RCON unavailable', async () => {
      mockRconEnabled.mockReturnValue(false)
      mockFsp.readFile.mockResolvedValue(
        JSON.stringify([{ name: 'Steve' }, { name: 'Alex' }, { name: 'Notch' }])
      )

      const players = await listWhitelist()

      expect(players).toEqual(['Steve', 'Alex', 'Notch'])
    })

    it('handles empty whitelist file', async () => {
      mockRconEnabled.mockReturnValue(false)
      mockFsp.readFile.mockRejectedValue(new Error('File not found'))

      const players = await listWhitelist()

      expect(players).toEqual([])
    })

    it('handles invalid RCON response', async () => {
      mockRconEnabled.mockReturnValue(true)
      mockRconExec.mockResolvedValue('Invalid response format')

      const players = await listWhitelist()

      expect(players).toEqual([])
    })
  })
})
