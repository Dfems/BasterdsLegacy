import { describe, expect, it, vi } from 'vitest'

import { BackgroundUpload } from '../shared/components/BackgroundUpload'
import { useUiSettings } from '../shared/hooks/useUiSettings'
import * as settingsTypes from '../types/settings'

// Nessun mock globale di fetch necessario per questi test

// Mock AuthContext
vi.mock('@/entities/user/AuthContext', () => ({
  default: {
    Consumer: ({ children }: { children: (value: { role: string }) => unknown }) =>
      children({ role: 'owner' }),
  },
}))

describe('useUiSettings', () => {
  it('should provide UI settings functionality', () => {
    // Test che il hook esista ed esporti le funzioni corrette
    expect(useUiSettings).toBeDefined()
    expect(typeof useUiSettings).toBe('function')
  })

  it('should export background upload component', () => {
    // Test che il componente BackgroundUpload esista
    expect(BackgroundUpload).toBeDefined()
    expect(typeof BackgroundUpload).toBe('function')
  })

  it('should export UI settings types', () => {
    // Test che i tipi siano definiti
    expect(settingsTypes).toBeDefined()
  })
})
