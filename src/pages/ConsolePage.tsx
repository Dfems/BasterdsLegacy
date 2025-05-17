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

  const [command, setCommand] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');

  // Se non sei autenticato, torni a login
  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  const executeCommand = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const resp = await fetch('/api/console', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error ?? resp.statusText);
      }
      const data = await resp.text();
      setConsoleOutput(data);
    } catch (err: unknown) {
      setConsoleOutput(`Errore: ${(err as Error).message}`);
    }
  };

  return (
    <div className="container-xl">
      <h1>{t.consoleTitle}</h1>
      <form onSubmit={executeCommand}>
        <div>
          <label htmlFor="command">{t.commandLabel}</label>{' '}
          <input
            id="command"
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            required
          />{' '}
          <button type="submit">{t.executeButtonLabel}</button>
        </div>
      </form>
      <div>
        <h2>{t.consoleOutputTitle}</h2>
        <textarea
          value={consoleOutput}
          readOnly
          rows={20}
          cols={80}
        />
      </div>
    </div>
  );
}
