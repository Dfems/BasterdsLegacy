import type { JSX } from 'react'
import { useContext } from 'react'

import { Outlet } from 'react-router-dom'

import Navbar from '../components/Navbar'
import AuthContext from '../contexts/AuthContext'
import useLanguage from '../hooks/useLanguage'

export default function MainLayout(): JSX.Element {
  useLanguage()
  const { token, logout } = useContext(AuthContext)

  const isLoggedIn = Boolean(token)

  return (
    <div>
      <Navbar isLoggedIn={isLoggedIn} onLogout={logout} />
      <div style={{ paddingTop: 56 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
