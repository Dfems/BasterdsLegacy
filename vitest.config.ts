import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    coverage: { reporter: ['text', 'lcov'], all: true, include: ['src/**/*.{ts,tsx}'] },
    exclude: ['**/node_modules/**', '**/dist/**', 'server/**'],
  },
})
