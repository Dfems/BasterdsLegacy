import { useState, useContext } from 'react';
import type { FormEvent, JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';

export default function Login(): JSX.Element {
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
    <form onSubmit={handleSubmit}>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <div>
            <label>Utente:</label>
            <input
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
        <button type="submit">Accedi</button>
    </form>
  );
}
