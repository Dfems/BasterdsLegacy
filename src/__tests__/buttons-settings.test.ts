import { describe, expect, it, vi } from 'vitest'

import { useButtonsSettings } from '@/shared/hooks/useButtonsSettings'

// Mock per react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: {
      launcher: { visible: true, path: 'test-launcher.jar' },
      config: { visible: true, path: 'test-config.zip' },
      modpack: { name: 'Test Modpack', version: '1.0.0' },
    },
    isLoading: false,
    error: null,
  })),
}))

describe('useButtonsSettings', () => {
  it('should return buttons settings structure', () => {
    const result = useButtonsSettings()

    expect(result.data).toBeDefined()
    expect(result.data?.launcher).toHaveProperty('visible')
    expect(result.data?.launcher).toHaveProperty('path')
    expect(result.data?.config).toHaveProperty('visible')
    expect(result.data?.config).toHaveProperty('path')
    expect(result.data?.modpack).toHaveProperty('name')
    expect(result.data?.modpack).toHaveProperty('version')
  })
})
