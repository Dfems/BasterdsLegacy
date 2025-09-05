import { useContext, useEffect, useRef, useState } from 'react'

import AuthContext from '@/entities/user/AuthContext'

export type ModpackInstallProgress = {
  installing: boolean
  progress: string[]
  completed: boolean
  error: string | null
}

export const useModpackInstallProgress = () => {
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
        } else if (msg.type === 'error') {
          setProgress((prev) => ({
            ...prev,
            installing: false,
            error: msg.data,
            progress: [...prev.progress, `Errore: ${msg.data}`],
          }))
        }
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      wsRef.current = null
    }

    ws.onerror = () => {
      setProgress((prev) => ({
        ...prev,
        installing: false,
        error: 'Errore di connessione WebSocket',
      }))
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
