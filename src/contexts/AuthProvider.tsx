// src/contexts/AuthProvider.tsx
import type { JSX, ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'

import { jwtDecode } from 'jwt-decode'

import AuthContext, { type AuthContextType } from './AuthContext'

interface Props {
  children: ReactNode
}
interface DecodedToken {
  exp: number
}

export default function AuthProvider({ children }: Props): JSX.Element {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [role, setRole] = useState<'owner' | 'user' | 'viewer' | null>(() => {
    const t = localStorage.getItem('token')
    if (!t) return null
    try {
      const decoded = jwtDecode<DecodedToken & { role?: 'owner' | 'user' | 'viewer' }>(t)
      return decoded.role ?? null
    } catch {
      return null
    }
  })

  // salvataggio/cleanup in localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  // auto-logout alla scadenza
  const logout = useCallback(() => {
    setToken(null)
    setRole(null)
  }, [])
  useEffect(() => {
    if (!token) return
    const { exp, role: r } = jwtDecode<DecodedToken & { role?: 'owner' | 'user' | 'viewer' }>(token)
    if (r) setRole(r)
    const msLeft = exp * 1000 - Date.now()
    if (msLeft <= 0) return logout()

    const id = window.setTimeout(logout, msLeft)
  // Se il token non ha exp, non schedulare auto-logout lato client
  if (!exp || Number.isNaN(exp)) return
    return () => clearTimeout(id)
  }, [token, logout])

  useEffect(() => {
    const realFetch = window.fetch
    window.fetch = async (input, init = {}) => {
      // 1) inietto sempre il Bearer token se esiste
      const headers = new Headers(init.headers)
      if (token) headers.set('Authorization', `Bearer ${token}`)

      // 2) faccio la chiamata
      const response = await realFetch(input, { ...init, headers })

      // 3) intercetto il nuovo token se presente
      const refresh = response.headers.get('x-refresh-token')
      if (refresh) {
        console.log('🔄 Received x-refresh-token, updating client token')
        setToken(refresh)
        try {
          const d = jwtDecode<DecodedToken & { role?: 'owner' | 'user' | 'viewer' }>(refresh)
          if (d.role) setRole(d.role)
        } catch {}
      }

      return response
    }
    return () => {
      window.fetch = realFetch
    }
  }, [token])

  const login: AuthContextType['login'] = async (username, password) => {
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password }),
    })
    const data = (await resp.json()) as {
      token: string
      role?: 'owner' | 'user' | 'viewer'
      error?: string
    }
    if (!resp.ok) throw new Error(data.error ?? 'Login fallito')
    setToken(data.token)
    if (data.role) setRole(data.role)
  }

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>{children}</AuthContext.Provider>
  )
}
