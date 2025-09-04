import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock child_process
const mockProcess = {
  stdout: new EventEmitter(),
  stderr: new EventEmitter(),
  on: vi.fn(),
  kill: vi.fn(),
  pid: 12345,
}

const mockSpawn = vi.fn(() => mockProcess)

vi.mock('node:child_process', () => ({
  spawn: mockSpawn,
}))

// Mock pidusage
vi.mock('pidusage', () => ({
  default: vi.fn(() => Promise.resolve({ cpu: 45.5, memory: 2048 })),
}))

// Mock config
vi.mock('../lib/config.js', () => ({
  CONFIG: {
    MC_DIR: '/test/minecraft',
    JAVA_BIN: 'java',
  },
}))

// Mock logs
vi.mock('../minecraft/logs.js', () => ({
  appendLog: vi.fn(),
}))

describe('ProcessManager', () => {
  let ProcessManager: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockProcess.on.mockClear()
    mockSpawn.mockClear()

    // Dynamic import to ensure fresh module state
    const module = await import('../minecraft/process.js')
    ProcessManager = module.processManager.constructor

    // Reset the singleton state
    const pm = (module as any).processManager
    pm.proc = null
    pm._state = 'STOPPED'
    pm.startedAt = null
  })

  it('initializes with STOPPED state', async () => {
    const { processManager } = await import('../minecraft/process.js')
    expect(processManager.state).toBe('STOPPED')
  })

  it('starts minecraft server process', async () => {
    const { processManager } = await import('../minecraft/process.js')

    const promise = processManager.start()

    expect(mockSpawn).toHaveBeenCalledWith(
      'java',
      ['-Xmx1G', '-Xms1G', '-jar', '/test/minecraft/server.jar', 'nogui'],
      { cwd: '/test/minecraft', stdio: 'pipe' }
    )

    expect(processManager.state).toBe('RUNNING')
    await promise
  })

  it('prevents multiple starts', async () => {
    const { processManager } = await import('../minecraft/process.js')

    await processManager.start()
    const secondStart = await processManager.start()

    expect(mockSpawn).toHaveBeenCalledTimes(1)
    expect(secondStart).toBeUndefined()
  })

  it('stops running server', async () => {
    const { processManager } = await import('../minecraft/process.js')

    await processManager.start()
    expect(processManager.state).toBe('RUNNING')

    processManager.stop()
    expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM')
  })

  it('handles server restart', async () => {
    const { processManager } = await import('../minecraft/process.js')

    await processManager.start()
    const killSpy = vi.spyOn(processManager, 'stop')
    const startSpy = vi.spyOn(processManager, 'start')

    await processManager.restart()

    expect(killSpy).toHaveBeenCalled()
    expect(startSpy).toHaveBeenCalled()
  })

  it('emits log events from stdout', async () => {
    const { processManager } = await import('../minecraft/process.js')
    const logSpy = vi.fn()

    processManager.on('log', logSpy)
    await processManager.start()

    // Simulate server log output
    const testLog = '[INFO] Server started'
    mockProcess.stdout.emit('data', Buffer.from(testLog))

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        line: testLog,
        ts: expect.any(Number),
      })
    )
  })

  it('emits log events from stderr', async () => {
    const { processManager } = await import('../minecraft/process.js')
    const logSpy = vi.fn()

    processManager.on('log', logSpy)
    await processManager.start()

    // Simulate server error output
    const testError = '[ERROR] Something went wrong'
    mockProcess.stderr.emit('data', Buffer.from(testError))

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        line: testError,
        ts: expect.any(Number),
      })
    )
  })

  it('handles process exit', async () => {
    const { processManager } = await import('../minecraft/process.js')
    const statusSpy = vi.fn()

    processManager.on('status', statusSpy)
    await processManager.start()

    // Simulate process exit
    const exitCallback = mockProcess.on.mock.calls.find((call) => call[0] === 'exit')?.[1]
    if (exitCallback) {
      exitCallback(0)
    }

    expect(processManager.state).toBe('STOPPED')
    expect(statusSpy).toHaveBeenCalledWith({ state: 'STOPPED' })
  })

  it('writes commands to process stdin', async () => {
    const { processManager } = await import('../minecraft/process.js')

    const mockWrite = vi.fn()
    mockProcess.stdin = { write: mockWrite }

    await processManager.start()
    processManager.write('say Hello World\n')

    expect(mockWrite).toHaveBeenCalledWith('say Hello World\n')
  })

  it('returns status with metrics', async () => {
    const { processManager } = await import('../minecraft/process.js')

    const status = await processManager.getStatus()

    expect(status).toHaveProperty('state')
    expect(status).toHaveProperty('pid')
    expect(status).toHaveProperty('uptimeMs')
    expect(status).toHaveProperty('cpu')
    expect(status).toHaveProperty('memMB')
  })

  it('calculates uptime correctly', async () => {
    const { processManager } = await import('../minecraft/process.js')

    await processManager.start()

    // Wait a bit to have some uptime
    await new Promise((resolve) => setTimeout(resolve, 10))

    const status = await processManager.getStatus()
    expect(status.uptimeMs).toBeGreaterThan(0)
  })

  it('handles CPU and memory metrics', async () => {
    const { processManager } = await import('../minecraft/process.js')

    await processManager.start()
    const status = await processManager.getStatus()

    expect(status.cpu).toBe(45.5)
    expect(status.memMB).toBe(2048)
  })

  it('handles pidusage errors gracefully', async () => {
    const pidusage = await import('pidusage')
    vi.mocked(pidusage.default).mockRejectedValueOnce(new Error('Process not found'))

    const { processManager } = await import('../minecraft/process.js')
    await processManager.start()

    const status = await processManager.getStatus()
    expect(status.cpu).toBe(0)
    expect(status.memMB).toBe(0)
  })
})
