/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from 'react'

import type { ThemeMode } from '@/types/theme'

type Ctx = {
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
  resolved: 'light' | 'dark'
}

const ThemeModeContext = createContext<Ctx | null>(null)

const STORAGE_KEY = 'theme-mode'

const getSystem = (): 'light' | 'dark' =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export const ThemeModeProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = (typeof window !== 'undefined' &&
      localStorage.getItem(STORAGE_KEY)) as ThemeMode | null
    return saved ?? 'system'
  })

  const [system, setSystem] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' ? getSystem() : 'dark'
  )

  useEffect(() => {
    if (mode !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => setSystem(media.matches ? 'dark' : 'light')
    listener()
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [mode])

  const resolved = mode === 'system' ? system : mode

  const applyClass = useCallback((m: 'light' | 'dark') => {
    const el = document.documentElement
    el.classList.remove('light', 'dark')
    el.classList.add(m)
    // suggerisci a browser il color-scheme per controlli native
    document.documentElement.style.colorScheme = m
  }, [])

  useEffect(() => {
    applyClass(resolved)
  }, [resolved, applyClass])

  const setModePersist = useCallback((m: ThemeMode) => {
    setMode(m)
    localStorage.setItem(STORAGE_KEY, m)
  }, [])

  const value = useMemo<Ctx>(
    () => ({ mode, setMode: setModePersist, resolved }),
    [mode, setModePersist, resolved]
  )

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>
}

export const useThemeMode = (): Ctx => {
  const ctx = useContext(ThemeModeContext)
  // Fallback per ambienti di test non provider-izzati
  if (!ctx) return { mode: 'system', setMode: () => {}, resolved: 'dark' }
  return ctx
}

// Re-export the centralized ThemeMode type
export type { ThemeMode } from '@/types/theme'
