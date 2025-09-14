import { describe, expect, it } from 'vitest'

import { useRotatingBackground } from '../shared/hooks/useRotatingBackground'

describe('useRotatingBackground', () => {
  it('should be exported and be a function', () => {
    expect(useRotatingBackground).toBeDefined()
    expect(typeof useRotatingBackground).toBe('function')
  })
})
