import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type JSX,
} from 'react'

import AuthContext from '../contexts/AuthContext'
import useLanguage from '../hooks/useLanguage'
import '../styles/App.css'

type WsMsg = { type?: string; data?: unknown }

export default function ConsolePage(): JSX.Element {
  const { t } = useLanguage()
  const { token } = useContext(AuthContext)

  const [command, setCommand] = useState('')
  const [output, setOutput] = useState('')
  const [busy, setBusy] = useState(false)
  const [serverRunning, setServerRunning] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const outputRef = useRef<HTMLTextAreaElement>(null)

  // auto scroll
  useEffect(() => {
    const el = outputRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [output])

  const fetchStatus = useCallback(async () => {
    try {
      const resp = await fetch('/api/status')
      const data = (await resp.json()) as { running?: boolean }
      setServerRunning(Boolean(data.running))
    } catch {
      setServerRunning(false)
    }
  }, [])

  // connect WS when token and running
  useEffect(() => {
    if (!token) return
    const connect = () => {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws'
      const ws = new WebSocket(
        `${proto}://${location.host}/ws/console?token=${encodeURIComponent(token)}`
      )
      wsRef.current = ws
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as WsMsg
          if (msg.type === 'log' && typeof msg.data === 'string') {
            setOutput((o) => o + msg.data + '\n')
          } else if (msg.type === 'status' && msg.data && typeof msg.data === 'object') {
            const running = (msg.data as { running?: boolean }).running
            if (typeof running === 'boolean') setServerRunning(running)
          }
        } catch {
          // ignore
        }
      }
      ws.onclose = () => {
        wsRef.current = null
      }
    }
    fetchStatus().then(connect).catch(connect)
    return () => {
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [token, fetchStatus])

  const sendCmd = useCallback((cmd: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    const payload = JSON.stringify({ type: 'cmd', data: cmd })
    wsRef.current.send(payload)
    setOutput((o) => o + `> ${cmd}\n`)
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!serverRunning) return
    const trimmed = command.trim()
    if (trimmed) sendCmd(trimmed)
    setCommand('')
  }

  const power = useCallback(
    async (action: 'start' | 'stop' | 'restart') => {
      setBusy(true)
      try {
        await fetch('/api/power', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        if (action === 'start') setOutput((o) => o + 'Avvio in corso...\n')
        if (action === 'stop') setOutput((o) => o + 'Arresto in corso...\n')
        if (action === 'restart') setOutput((o) => o + 'Riavvio in corso...\n')
        await fetchStatus()
      } catch (e) {
        setOutput((o) => o + `Errore power: ${(e as Error).message}\n`)
      } finally {
        setBusy(false)
      }
    },
    [fetchStatus]
  )

  const clearOutput = () => setOutput('')

  return (
    <div className="console-container">
      <aside className="sidebar-buttons">
        <button onClick={() => power(serverRunning ? 'stop' : 'start')} disabled={busy}>
          {serverRunning ? 'Stop' : 'Start'}
        </button>
        <button onClick={() => power('restart')} disabled={busy || !serverRunning}>
          Restart
        </button>
        <button onClick={clearOutput} disabled={busy}>
          Clear
        </button>
      </aside>

      <main className="console-main">
        <h1>{t.consoleTitle}</h1>
        <div>
          Stato server:{' '}
          {serverRunning ? (
            <span style={{ color: 'green' }}>Avviato</span>
          ) : (
            <span style={{ color: 'red' }}>Spento</span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="command-form">
          <label htmlFor="command">{t.commandLabel}</label>
          <input
            id="command"
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            disabled={busy || !serverRunning}
            required
          />
        </form>

        <h2>{t.consoleOutputTitle}</h2>
        <textarea
          ref={outputRef}
          readOnly
          rows={25}
          cols={130}
          value={output}
          className="console-output"
        />
      </main>
    </div>
  )
}
