import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock rcon-client
const mockRconConnect = vi.fn()
const mockRconSend = vi.fn()
const mockRconOn = vi.fn()

const mockRconInstance = {
  send: mockRconSend,
  on: mockRconOn,
}

vi.doMock('rcon-client', () => ({
  Rcon: {
    connect: mockRconConnect,
  },
}))

vi.doMock('../lib/config.js', () => ({
  CONFIG: {
    RCON_ENABLED: true,
    RCON_PASS: 'test-password',
    RCON_HOST: 'localhost',
    RCON_PORT: 25575,
  },
}))

describe('RCON Module', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    // Setup default mock behaviors
    mockRconConnect.mockResolvedValue(mockRconInstance)
    mockRconSend.mockResolvedValue('Command executed successfully')
  })

  describe('rconEnabled', () => {
    it('returns true when RCON is enabled and password is set', async () => {
      const { rconEnabled } = await import('../minecraft/rcon.js')
      expect(rconEnabled()).toBe(true)
    })

    it('returns false when RCON is disabled', async () => {
      vi.doMock('../lib/config.js', () => ({
        CONFIG: {
          RCON_ENABLED: false,
          RCON_PASS: 'test-password',
          RCON_HOST: 'localhost',
          RCON_PORT: 25575,
        },
      }))

      vi.resetModules()
      const { rconEnabled } = await import('../minecraft/rcon.js')
      expect(rconEnabled()).toBe(false)
    })

    it('returns false when password is empty', async () => {
      vi.doMock('../lib/config.js', () => ({
        CONFIG: {
          RCON_ENABLED: true,
          RCON_PASS: '',
          RCON_HOST: 'localhost',
          RCON_PORT: 25575,
        },
      }))

      vi.resetModules()
      const { rconEnabled } = await import('../minecraft/rcon.js')
      expect(rconEnabled()).toBe(false)
    })
  })

  describe('getRcon', () => {
    it('creates new RCON connection when none exists', async () => {
      const { getRcon } = await import('../minecraft/rcon.js')

      const client = await getRcon()

      expect(mockRconConnect).toHaveBeenCalledWith({
        host: 'localhost',
        port: 25575,
        password: 'test-password',
      })
      expect(client).toBe(mockRconInstance)
    })

    it('reuses existing RCON connection', async () => {
      const { getRcon } = await import('../minecraft/rcon.js')

      const client1 = await getRcon()
      const client2 = await getRcon()

      expect(mockRconConnect).toHaveBeenCalledTimes(1)
      expect(client1).toBe(client2)
    })

    it('throws error when RCON is disabled', async () => {
      vi.doMock('../lib/config.js', () => ({
        CONFIG: {
          RCON_ENABLED: false,
          RCON_PASS: 'test-password',
          RCON_HOST: 'localhost',
          RCON_PORT: 25575,
        },
      }))

      vi.resetModules()
      const { getRcon } = await import('../minecraft/rcon.js')

      await expect(getRcon()).rejects.toThrow('RCON disabled')
    })

    it('handles connection end event', async () => {
      const { getRcon } = await import('../minecraft/rcon.js')

      await getRcon()

      // Simulate connection end
      const endCallback = mockRconOn.mock.calls.find((call) => call[0] === 'end')?.[1]
      if (endCallback) {
        endCallback()
      }

      // Next getRcon call should create a new connection
      await getRcon()
      expect(mockRconConnect).toHaveBeenCalledTimes(2)
    })

    it('handles connection errors', async () => {
      mockRconConnect.mockRejectedValueOnce(new Error('Connection refused'))

      const { getRcon } = await import('../minecraft/rcon.js')

      await expect(getRcon()).rejects.toThrow('Connection refused')
    })
  })

  describe('rconExec', () => {
    it('executes RCON command successfully', async () => {
      const { rconExec } = await import('../minecraft/rcon.js')

      const result = await rconExec('list')

      expect(mockRconSend).toHaveBeenCalledWith('list')
      expect(result).toBe('Command executed successfully')
    })

    it('handles string response from RCON', async () => {
      mockRconSend.mockResolvedValueOnce('There are 0/20 players online:')

      const { rconExec } = await import('../minecraft/rcon.js')

      const result = await rconExec('list')
      expect(result).toBe('There are 0/20 players online:')
    })

    it('converts non-string response to string', async () => {
      mockRconSend.mockResolvedValueOnce(42)

      const { rconExec } = await import('../minecraft/rcon.js')

      const result = await rconExec('some-command')
      expect(result).toBe('42')
    })

    it('handles RCON command errors', async () => {
      mockRconSend.mockRejectedValueOnce(new Error('Command failed'))

      const { rconExec } = await import('../minecraft/rcon.js')

      await expect(rconExec('invalid-command')).rejects.toThrow('Command failed')
    })

    it('throws error when RCON is disabled', async () => {
      vi.doMock('../lib/config.js', () => ({
        CONFIG: {
          RCON_ENABLED: false,
          RCON_PASS: '',
          RCON_HOST: 'localhost',
          RCON_PORT: 25575,
        },
      }))

      vi.resetModules()
      const { rconExec } = await import('../minecraft/rcon.js')

      await expect(rconExec('list')).rejects.toThrow('RCON disabled')
    })

    it('executes multiple commands sequentially', async () => {
      mockRconSend
        .mockResolvedValueOnce('Command 1 result')
        .mockResolvedValueOnce('Command 2 result')

      const { rconExec } = await import('../minecraft/rcon.js')

      const result1 = await rconExec('command1')
      const result2 = await rconExec('command2')

      expect(result1).toBe('Command 1 result')
      expect(result2).toBe('Command 2 result')
      expect(mockRconSend).toHaveBeenCalledTimes(2)
    })

    it('handles empty command', async () => {
      const { rconExec } = await import('../minecraft/rcon.js')

      await rconExec('')

      expect(mockRconSend).toHaveBeenCalledWith('')
    })

    it('handles special characters in commands', async () => {
      const { rconExec } = await import('../minecraft/rcon.js')

      const command = 'say Hello World! @player'
      await rconExec(command)

      expect(mockRconSend).toHaveBeenCalledWith(command)
    })

    it('handles long commands', async () => {
      const { rconExec } = await import('../minecraft/rcon.js')

      const longCommand = 'say ' + 'A'.repeat(1000)
      await rconExec(longCommand)

      expect(mockRconSend).toHaveBeenCalledWith(longCommand)
    })

    it('maintains connection across multiple commands', async () => {
      const { rconExec } = await import('../minecraft/rcon.js')

      await rconExec('list')
      await rconExec('help')
      await rconExec('version')

      expect(mockRconConnect).toHaveBeenCalledTimes(1) // Should reuse connection
      expect(mockRconSend).toHaveBeenCalledTimes(3)
    })
  })
})
