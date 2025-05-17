// src/contexts/AuthProvider.tsx
import { useState, useEffect, useCallback } from 'react';
import type { JSX, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import AuthContext, { type AuthContextType } from './AuthContext';

interface Props {
  children: ReactNode;
}

interface DecodedToken {
  exp: number;
}

export default function AuthProvider({ children }: Props): JSX.Element {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token')
  );

  // Persiste il token in localStorage
  useEffect(() => {
    if (token !== null) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // Auto-logout alla scadenza del token
  const logout = useCallback(() => {
    setToken(null);
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }
    let timeoutId: number;
    try {
      const { exp } = jwtDecode<DecodedToken>(token);
      const msLeft = exp * 1000 - Date.now();
      if (msLeft <= 0) {
        logout();
      } else {
        timeoutId = window.setTimeout(logout, msLeft);
      }
    } catch {
      // In caso di token malformato
      logout();
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [token, logout]);

  // Funzione di login: salva il nuovo token
  const login: AuthContextType['login'] = async (username, password) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json() as { token: string; error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? 'Login fallito');
    }
    setToken(data.token);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
