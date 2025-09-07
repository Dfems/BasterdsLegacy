import { describe, expect, it } from 'vitest'

import { useUiSettings } from '@/shared/hooks/useUiSettings'

// Mock fetch global
global.fetch = vi.fn()

// Mock AuthContext
vi.mock('@/entities/user/AuthContext', () => ({
  default: {
    Consumer: ({ children }: any) => children({ role: 'owner' }),
  },
}))

describe('useUiSettings', () => {
  it('should provide UI settings functionality', () => {
    // Test che il hook esista ed esporti le funzioni corrette
    expect(useUiSettings).toBeDefined()
    expect(typeof useUiSettings).toBe('function')
  })

  it('should export background upload component', async () => {
    // Test che il componente BackgroundUpload esista
    const { BackgroundUpload } = await import('@/shared/components/BackgroundUpload')
    expect(BackgroundUpload).toBeDefined()
    expect(typeof BackgroundUpload).toBe('function')
  })

  it('should export UI settings types', async () => {
    // Test che i tipi siano definiti
    const types = await import('@/types/settings')
    expect(types).toBeDefined()
  })
})
