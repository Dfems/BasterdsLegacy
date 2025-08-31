import React from 'react'
import type { JSX } from 'react'
import { useContext } from 'react'

import { Outlet } from 'react-router-dom'

import Navbar from '../components/Navbar'
import AuthContext from '../contexts/AuthContext'
import useLanguage from '../hooks/useLanguage'

export default function MainLayout(): JSX.Element {
  const { language, setLanguage } = useLanguage()
  const { token, logout } = useContext(AuthContext)

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value)
  }

  const isLoggedIn = Boolean(token)

  return (
    <div>
      <Navbar isLoggedIn={isLoggedIn} onLogout={logout} />
      <div style={{ marginTop: '30px' }}>
        <Outlet />
      </div>
      <div style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
        <select value={language} onChange={handleLanguageChange}>
          <option value="it">Italiano</option>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
    </div>
  )
}
