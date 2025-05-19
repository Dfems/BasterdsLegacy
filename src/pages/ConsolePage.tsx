// src/pages/ConsolePage.tsx
import { useState, useContext, useEffect, useRef, type FormEvent, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import useLanguage from '../hooks/useLanguage';
import AuthContext from '../contexts/AuthContext';
import '../styles/App.css';

export default function ConsolePage(): JSX.Element {
  const { t } = useLanguage();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [command, setCommand] = useState<string>('');
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [installing, setInstalling] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const OS_TYPE = import.meta.env.VITE_OS_TYPE ?? 'linux';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) navigate('/login', { replace: true });
  }, [token, navigate]);

  // Auto-scroll on output update
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  // Stream a shell command via chunked fetch
  const streamCommand = async (cmd: string) => {
    const resp = await fetch('/api/console', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ command: cmd }),
    });
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error ?? resp.statusText);
    }

    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      if (value) setConsoleOutput(prev => prev + decoder.decode(value, { stream: true }));
      done = doneReading;
    }
  };

  // Execute arbitrary command
  const executeCommand = async (cmd: string) => {
    if (cmd.trim() === 'clear') {
      setConsoleOutput('');
      return;
    }
    try {
      setConsoleOutput(prev => prev + `> ${cmd}\n`);
      await streamCommand(cmd);
      setConsoleOutput(prev => prev + '\n');
    } catch (err: unknown) {
      const msg = (err as Error).message;
      setConsoleOutput(prev => prev + `\nErrore: ${msg}\n`);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cmd = command.trim();
    if (!cmd) return;
    setCommand('');
    executeCommand(cmd);
  };

  const handleShortcut = (cmd: string) => {
    executeCommand(cmd);
  };

  // Install server and configure JVM args
  const handleInstall = async () => {
    const jar = window.prompt('Inserisci il nome del file JAR da installare:');
    if (!jar) {
      alert('Nessun file JAR fornito.');
      return;
    }
    const minGb = window.prompt('RAM minima (GB):');
    const maxGb = window.prompt('RAM massima (GB):');
    if (!minGb || !maxGb) {
      alert('Valori di RAM non validi.');
      return;
    }
    setInstalling(true);
    setConsoleOutput(prev => prev + `> java -jar ${jar} --installServer\n`);
    try {
      await streamCommand(`java -jar ${jar} --installServer`);

      // Prepara la riga da aggiungere
      const argsLine = `-Xms${minGb}G -Xmx${maxGb}G`;
      let cmdSequence: string;
      if (OS_TYPE === 'windows') {
        // Powershell: aggiunge riga vuota e poi args, senza caratteri null
        cmdSequence = `Add-Content -Path user_jvm_args.txt -Value ''; Add-Content -Path user_jvm_args.txt -Value '${argsLine}'`;
      } else {
        // Bash
        cmdSequence = `echo "" >> user_jvm_args.txt && echo "${argsLine}" >> user_jvm_args.txt`;
      }

      setConsoleOutput(prev => prev + `> ${cmdSequence}\n`);
      await streamCommand(cmdSequence);

      // Su Windows, rimuovi la riga 'pause' da run.bat
      if (OS_TYPE === 'windows') {
        const removePause = `(Get-Content -Path "run.bat") | Where-Object { $_ -notlike "*pause*" } | Set-Content -Path "run.bat"`;
        setConsoleOutput(prev => prev + `> ${removePause}\n`);
        await streamCommand(removePause);
      }

      setConsoleOutput(prev => prev + `\nInstallazione e configurazione RAM completate.\n`);
      alert(`Installazione completata. user_jvm_args.txt aggiornato con: ${argsLine}`);
    } catch (err: unknown) {
      const msg = (err as Error).message;
      setConsoleOutput(prev => prev + `\nErrore durante install: ${msg}\n`);
    } finally {
      setInstalling(false);
      setCommand('');
    }
  };

  // Avvia server (run.bat o run.sh)
  const handleRun = async () => {
    const runCmd = OS_TYPE === 'windows' ? '.\\run.bat' : './run.sh';
    setConsoleOutput(prev => prev + `> ${runCmd}\n`);
    try {
      await streamCommand(runCmd);
      setConsoleOutput(prev => prev + '\n');
    } catch (err: unknown) {
      const msg = (err as Error).message;
      setConsoleOutput(prev => prev + `\nErrore durante run: ${msg}\n`);
    }finally {
      setCommand('');
    }
  };

  return (
    <div style={{ display: 'flex', padding: '2rem' }}>
      <div className="sidebar-buttons">
        <button
          onClick={handleInstall}
          disabled={installing}
          style={{ marginBottom: 8 }}
        >
          {installing ? 'Installazione…' : 'Install'}
        </button>
        <button
          onClick={handleRun}
          style={{ marginBottom: 8 }}
        >
          Run
        </button>
        <button onClick={() => handleShortcut('clear')} style={{ marginBottom: 8 }}>
          Clear
        </button>
        <button onClick={() => handleShortcut('ls')} style={{ marginBottom: 8 }}>
          ls
        </button>
        <button onClick={() => handleShortcut('pwd')} style={{ marginBottom: 8 }}>
          pwd
        </button>
      </div>

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
            disabled={installing}
          />{' '}
        </form>
        <h2>{t.consoleOutputTitle}</h2>
        <textarea
          ref={textareaRef}
          value={consoleOutput}
          readOnly
          rows={25}
          cols={130}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}
