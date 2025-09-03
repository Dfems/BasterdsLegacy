/**
 * Safe localStorage utilities with fallbacks
 */

export const storage = {
  /**
   * Get item from localStorage with fallback
   */
  getItem: <T>(key: string, fallback?: T): T | null => {
    try {
      const item = localStorage.getItem(key)
      if (item === null) return fallback ?? null
      return JSON.parse(item) as T
    } catch {
      return fallback ?? null
    }
  },

  /**
   * Set item in localStorage
   */
  setItem: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Silently fail in case of quota exceeded or other errors
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch {
      // Silently fail
    }
  },

  /**
   * Check if localStorage is available
   */
  isAvailable: (): boolean => {
    try {
      const test = '__test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  },
}
