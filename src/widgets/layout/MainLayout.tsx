import type { JSX } from 'react'
import { useContext } from 'react'

import { Outlet } from 'react-router-dom'

import AuthContext from '@/entities/user/AuthContext'
import useLanguage from '@/shared/hooks/useLanguage'
import Navbar from '@/widgets/navbar/Navbar'

export default function MainLayout(): JSX.Element {
  useLanguage()
  const { token, logout } = useContext(AuthContext)

  const isLoggedIn = Boolean(token)

  return (
    <div>
      <Navbar isLoggedIn={isLoggedIn} onLogout={logout} />
      <div style={{ paddingTop: 56, paddingBottom: 64 }}>
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto', 
          padding: '0 12px' // Ridotto da 16px per mobile
        }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
