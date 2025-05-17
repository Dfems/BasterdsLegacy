import { useState, useContext } from 'react';
import type { FormEvent, JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import useLanguage from '../hooks/useLanguage';
import '../styles/App.css';

export default function Login(): JSX.Element {
    const { t } = useLanguage();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
          await login(username, password);
          navigate('/');
        } catch (err) {
          setError((err as Error).message);
        }
    };

  return (
    <div className="container-md" style={{ maxWidth: '1200px !important' }}>
      <h1>{t.loginTitle}</h1>
      <form onSubmit={handleSubmit}>
          <div>
              <label>Utente:</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
          </div>
          <div>
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
          </div>
          <button type="submit">Login</button>
          <br />
          <br />
          {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>
    </div>
  );
}