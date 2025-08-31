import {
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
  type JSX,
} from 'react'

import { useNavigate } from 'react-router-dom'

import AuthContext from '../contexts/AuthContext'
import useLanguage from '../hooks/useLanguage'
import '../styles/App.css'

export default function ConsolePage(): JSX.Element {
  const { t } = useLanguage()
  const { token } = useContext(AuthContext)
  const navigate = useNavigate()

  // — stati principali —
  const [command, setCommand] = useState('')
  const [output, setOutput] = useState('')
  const [busy, setBusy] = useState(false)
  const [serverRunning, setServerRunning] = useState(false)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)

  const outputRef = useRef<HTMLTextAreaElement>(null)

  // Redirect to login
  useEffect(() => {
    if (!token) navigate('/login', { replace: true })
  }, [token, navigate])

  // Auto-scroll dell’output
  useEffect(() => {
    const el = outputRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [output])

  // 1) FETCH STATUS
  const fetchStatus = useCallback(async () => {
    try {
      const resp = await fetch('/api/status', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const { running } = await resp.json()
      setServerRunning(running)
    } catch {
      setServerRunning(false)
    }
  }, [token])

  useEffect(() => {
    if (token) fetchStatus()
  }, [token, fetchStatus])

  // 2) LOG HISTORY + STREAM
  const fetchLogsHistoryAndStream = useCallback(async () => {
    // storicizziamo
    try {
      const resp = await fetch('/api/logs/history?lines=200', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const text = await resp.text()
      setOutput(text)
    } catch (err) {
      setOutput((o) => o + `Errore history: ${(err as Error).message}\n`)
    }
    // SSE live
    eventSource?.close()
    const es = new EventSource('/api/logs/stream')
    es.onmessage = (e) => setOutput((o) => o + e.data + '\n')
    setEventSource(es)
  }, [token, eventSource])

  // quando il server diventa “running” carichiamo i log
  useEffect(() => {
    if (serverRunning) {
      fetchLogsHistoryAndStream()
    } else {
      // se spento, chiudiamo lo stream
      eventSource?.close()
      setEventSource(null)
      setOutput('') // puliamo console
    }
  }, [serverRunning, fetchLogsHistoryAndStream, eventSource])

  // 3) RCON: invio comandi di gioco
  const sendMcCommand = useCallback(
    async (cmd: string) => {
      setOutput((o) => o + `> ${cmd}\n`)
      const resp = await fetch('/api/mc-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ command: cmd }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || resp.statusText)
      setOutput((o) => o + data.output + '\n')
    },
    [token]
  )

  // 4) INSTALL
  const runInstall = useCallback(async () => {
    const jar = prompt('Nome del file JAR:')
    const minGb = jar ? prompt('RAM minima (GB):') : null
    const maxGb = minGb ? prompt('RAM massima (GB):') : null
    if (!jar || !minGb || !maxGb) return alert('Installazione annullata.')

    setBusy(true)
    setOutput('')
    try {
      const resp = await fetch('/api/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jarName: jar, minGb, maxGb }),
      })
      const reader = resp.body!.getReader()
      const decoder = new TextDecoder()
      let done = false
      while (!done) {
        const { value, done: rDone } = await reader.read()
        if (value) setOutput((o) => o + decoder.decode(value, { stream: true }))
        done = rDone
      }
      setOutput((o) => o + '\nInstallazione completata.\n')
    } catch (err) {
      setOutput((o) => o + `\nErrore install: ${(err as Error).message}\n`)
    } finally {
      setBusy(false)
      fetchStatus()
    }
  }, [token, fetchStatus])

  // 5) START / STOP / RESTART / DELETE
  const startServer = useCallback(async () => {
    setBusy(true)
    try {
      await fetch('/api/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setOutput((o) => o + 'Avviando server…\n')
      setServerRunning(true)
    } catch (err) {
      setOutput((o) => o + `Errore start: ${(err as Error).message}\n`)
    } finally {
      setBusy(false)
    }
  }, [token])

  const stopServer = useCallback(async () => {
    setBusy(true)
    try {
      await fetch('/api/stop', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setOutput((o) => o + 'Server fermato.\n')
      setServerRunning(false)
    } catch (err) {
      setOutput((o) => o + `Errore stop: ${(err as Error).message}\n`)
    } finally {
      setBusy(false)
    }
  }, [token])

  const restartServer = useCallback(async () => {
    setBusy(true)
    try {
      await fetch('/api/restart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setOutput((o) => o + 'Server riavviato.\n')
      setServerRunning(true)
    } catch (err) {
      setOutput((o) => o + `Errore restart: ${(err as Error).message}\n`)
    } finally {
      setBusy(false)
    }
  }, [token])

  const deleteServer = useCallback(async () => {
    if (!confirm('Eliminare tutti i file del server?')) return
    setBusy(true)
    try {
      await fetch('/api/delete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setOutput((o) => o + 'Server eliminato.\n')
      setServerRunning(false)
    } catch (err) {
      setOutput((o) => o + `Errore delete: ${(err as Error).message}\n`)
    } finally {
      setBusy(false)
    }
  }, [token])

  const clearOutput = () => setOutput('')

  // 6) Invio comandi di gioco
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!serverRunning) return
    const trimmed = command.trim()
    if (trimmed) sendMcCommand(trimmed)
    setCommand('')
  }

  // 7) Pulsanti
  const shortcuts = [
    { label: 'Install', action: runInstall, disabled: busy },
    {
      label: serverRunning ? 'Stop' : 'Start',
      action: serverRunning ? stopServer : startServer,
      disabled: busy,
    },
    {
      label: 'Restart',
      action: restartServer,
      disabled: busy || !serverRunning,
    },
    {
      label: 'Delete',
      action: deleteServer,
      disabled: busy,
    },
    {
      label: 'Clear',
      action: clearOutput,
      disabled: busy,
    },
  ]

  return (
    <div className="console-container">
      <aside className="sidebar-buttons">
        {shortcuts.map(({ label, action, disabled }) => (
          <button key={label} onClick={action} disabled={disabled}>
            {busy && label === 'Install' ? 'Install…' : label}
          </button>
        ))}
      </aside>

      <main className="console-main">
        <h1>{t.consoleTitle}</h1>

        {/* Stato server */}
        <div>
          Stato server:{' '}
          {serverRunning ? (
            <span style={{ color: 'green' }}>Avviato</span>
          ) : (
            <span style={{ color: 'red' }}>Spento</span>
          )}
        </div>

        {/* Form comandi di gioco */}
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

        {/* Output console */}
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
