import { useContext, useEffect, useRef, useState } from 'react'

import AuthContext from '@/entities/user/AuthContext'

export type ModpackInstallProgress = {
  installing: boolean
  progress: string[]
  completed: boolean
  error: string | null
}

export const useModpackInstallProgress = (setBusy?: (busy: boolean) => void) => {
  const { token } = useContext(AuthContext)
  const [progress, setProgress] = useState<ModpackInstallProgress>({
    installing: false,
    progress: [],
    completed: false,
    error: null,
  })
  const wsRef = useRef<WebSocket | null>(null)

  const connectWebSocket = () => {
    if (!token || wsRef.current) return

    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(
      `${proto}://${location.host}/ws/modpack-install?token=${encodeURIComponent(token)}`
    )

    wsRef.current = ws

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as {
          type: 'progress' | 'complete' | 'error'
          data: string
        }

        if (msg.type === 'progress') {
          setProgress((prev) => ({
            ...prev,
            installing: true,
            progress: [...prev.progress, msg.data],
          }))
        } else if (msg.type === 'complete') {
          setProgress((prev) => ({
            ...prev,
            installing: false,
            completed: true,
            progress: [...prev.progress, msg.data],
          }))
          setBusy?.(false) // Riattiva il pulsante quando completato
        } else if (msg.type === 'error') {
          setProgress((prev) => ({
            ...prev,
            installing: false,
            error: msg.data,
            progress: [...prev.progress, `Errore: ${msg.data}`],
          }))
          setBusy?.(false) // Riattiva il pulsante in caso di errore
        }
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      wsRef.current = null
      setBusy?.(false) // Riattiva il pulsante se la connessione si chiude
    }

    ws.onerror = () => {
      setProgress((prev) => ({
        ...prev,
        installing: false,
        error: 'Errore di connessione WebSocket',
      }))
      setBusy?.(false) // Riattiva il pulsante in caso di errore
    }
  }

  const resetProgress = () => {
    setProgress({
      installing: false,
      progress: [],
      completed: false,
      error: null,
    })
  }

  useEffect(() => {
    return () => {
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [])

  return {
    progress,
    connectWebSocket,
    resetProgress,
  }
}
