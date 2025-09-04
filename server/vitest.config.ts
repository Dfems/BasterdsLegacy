import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      reporter: ['text', 'lcov'],
      all: true,
      include: ['src/**/*.{ts,js}'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.{ts,js}'],
    },
    testTimeout: 10000,
  },
})
