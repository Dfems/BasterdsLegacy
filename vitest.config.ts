import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    coverage: { reporter: ['text', 'lcov'], all: true, include: ['src/**/*.{ts,tsx}'] },
  },
})
