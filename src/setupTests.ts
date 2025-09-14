import '@testing-library/jest-dom/vitest'

// jsdom non implementa ResizeObserver: mock basico per i componenti Chakra/zag
class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const g = globalThis as unknown as { ResizeObserver?: unknown }
if (!g.ResizeObserver) {
  g.ResizeObserver = ResizeObserverMock
}
