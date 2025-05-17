// src/pages/ConsolePage.tsx
import { useState, useContext, useEffect, type FormEvent, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import useLanguage from '../hooks/useLanguage';
import AuthContext from '../contexts/AuthContext';
import '../styles/App.css';

export default function ConsolePage(): JSX.Element {
  const { t } = useLanguage();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const initialCwd = import.meta.env.VITE_SHELL_WORK_DIR ?? '';
  const [cwd, setCwd] = useState<string>(initialCwd);
  const [command, setCommand] = useState<string>('');
  const [consoleOutput, setConsoleOutput] = useState<string>(`${cwd} $ `);
  const [installing, setInstalling] = useState<boolean>(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) navigate('/login', { replace: true });
  }, [token, navigate]);

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      eventSource?.close();
    };
  }, [eventSource]);

  // Execute generic console command
  const executeCommand = async (cmd: string) => {
    if (cmd.trim() === 'clear') {
      setConsoleOutput(`${cwd} $ `);
      return;
    }
    try {
      const resp = await fetch('/api/console', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error ?? resp.statusText);
      }
      const { output, cwd: newCwd } = (await resp.json()) as { output: string; cwd: string };
      setCwd(newCwd);
      const block = [`${cwd} $ ${cmd}`, output.trimEnd()].join('\n');
      setConsoleOutput(prev => prev + '\n' + block + '\n' + `${newCwd} $ `);
    } catch (err: unknown) {
      const msg = (err as Error).message;
      setConsoleOutput(prev => prev + `\n\n${cwd} $ Errore: ${msg}\n${cwd} $ `);
    }
  };

  // Form submit handler
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cmd = command;
    setCommand('');
    executeCommand(cmd);
  };

  // Quick command shortcuts
  const handleShortcut = (cmd: string) => executeCommand(cmd);

  // Install command via SSE streaming
  const handleInstall = () => {
    const jar = window.prompt('Inserisci il nome del file JAR da installare:');
    if (!jar) { 
      alert('Nessun file JAR fornito.');
      return;
    }
    setInstalling(true);
    setConsoleOutput(prev => prev + `\n${cwd} $ java -jar ${jar} --installServer\n`);
    // Setup EventSource
    const src = new EventSource(`/api/console/stream?jar=${encodeURIComponent(jar)}`);
    setEventSource(src);
    src.onmessage = e => {
      setConsoleOutput(prev => prev + e.data + '\n');
    };
    src.onerror = () => {
      src.close();
      setInstalling(false);
      setConsoleOutput(prev => prev + `${cwd} $ `);
    };
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar with buttons */}
      <div className='sidebar-buttons'>
        <button onClick={() => handleShortcut('clear')} style={{ marginBottom: 8 }}>
          Clear
        </button>
        <button onClick={() => handleShortcut('ls')} style={{ marginBottom: 8 }}>
          ls
        </button>
        <button onClick={() => handleShortcut('pwd')} style={{ marginBottom: 8 }}>
          pwd
        </button>
        <button onClick={handleInstall} disabled={installing} style={{ marginBottom: 8 }}>
          Install
        </button>
      </div>

      {/* Main console section */}
      <div style={{ flex: 1 }}>
        <h1>{t.consoleTitle}</h1>
        <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <label htmlFor="command">{t.commandLabel}</label>{' '}
          <input
            id="command"
            type="text"
            value={command}
            onChange={e => setCommand(e.target.value)}
            required
          />{' '}
        </form>
        <h2>{t.consoleOutputTitle}</h2>
        <textarea
          value={consoleOutput}
          readOnly
          rows={20}
          cols={80}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}
