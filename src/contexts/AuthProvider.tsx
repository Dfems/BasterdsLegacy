import { useState, useEffect } from 'react';
import type { JSX, ReactNode } from 'react';
import AuthContext from '../contexts/AuthContext';
import type { AuthContextType } from '../contexts/AuthContext';

interface Props {
  children: ReactNode;
}

export default function AuthProvider({ children }: Props): JSX.Element {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token')
  );

  useEffect(() => {
    if (token !== null) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const login: AuthContextType['login'] = async (username, password) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      throw new Error('Login fallito');
    }
    const { token: newToken } = await response.json() as { token: string };
    setToken(newToken);
  };

  const logout: AuthContextType['logout'] = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
