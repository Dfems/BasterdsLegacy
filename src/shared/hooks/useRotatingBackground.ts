import { useEffect, useMemo, useState } from 'react'

// Ritorna un URL di background che ruota tra le immagini in src/assets/background
// Se non trova immagini, ritorna null
const readLsSeconds = (): number | null => {
  try {
    const v = localStorage.getItem('bgRotateSeconds')
    if (!v) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

const readLsEnabled = (): boolean | null => {
  try {
    const v = localStorage.getItem('bgRotateEnabled')
    if (v == null) return null
    return v === 'true'
  } catch {
    return null
  }
}

export const useRotatingBackground = (options?: {
  intervalSeconds?: number
}): { url: string | null; allUrls: string[] } => {
  const initialSeconds = options?.intervalSeconds ?? readLsSeconds() ?? 15
  const [seconds, setSeconds] = useState(() => Math.max(3, Math.floor(initialSeconds)))
  const [enabled, setEnabled] = useState<boolean>(() => readLsEnabled() ?? true)

  const urls = useMemo(() => {
    const modules = import.meta.glob('/src/assets/background/*.{png,jpg,jpeg,webp}', {
      eager: true,
      query: '?url',
      import: 'default',
    }) as Record<string, string>

    // Ordina per nome file per avere una sequenza deterministica
    return Object.entries(modules)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, url]) => url)
  }, [])

  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (urls.length === 0 || !enabled) return

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % urls.length)
    }, seconds * 1000)

    return () => clearInterval(id)
  }, [urls, seconds, enabled])

  // Ascolta modifiche runtime dell'intervallo (localStorage o custom event)
  useEffect(() => {
    // Try to load canonical seconds from server
    const run = async () => {
      try {
        const r = await fetch('/api/settings/ui-rotation')
        if (!r.ok) return
        const data = (await r.json()) as { seconds: number; enabled: boolean }
        setSeconds(Math.max(3, Math.floor(Number(data.seconds))))
        setEnabled(Boolean(data.enabled))
      } catch {
        // ignore failures, keep current
      }
    }
    void run()

    const onCustom = () => {
      const v = readLsSeconds()
      if (v != null) setSeconds(Math.max(3, Math.floor(v)))
      const e = readLsEnabled()
      if (e != null) setEnabled(e)
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'bgRotateSeconds' || e.key === 'bgRotateEnabled') onCustom()
    }
    try {
      window.addEventListener('bg-rotate-seconds:changed', onCustom as EventListener)
      window.addEventListener('bg-rotate-enabled:changed', onCustom as EventListener)
      window.addEventListener('storage', onStorage)
    } catch {}
    return () => {
      try {
        window.removeEventListener('bg-rotate-seconds:changed', onCustom as EventListener)
        window.removeEventListener('bg-rotate-enabled:changed', onCustom as EventListener)
        window.removeEventListener('storage', onStorage)
      } catch {}
    }
  }, [])

  const current = urls.length > 0 ? (urls[index % urls.length] ?? null) : null
  // If disabled, keep the first image static (or null if none)
  const effective = enabled ? current : (urls[0] ?? null)
  return { url: effective, allUrls: urls }
}
