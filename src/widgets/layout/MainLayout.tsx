import type { JSX } from 'react'
import { useContext } from 'react'

import { Outlet } from 'react-router-dom'

import AuthContext from '@/entities/user/AuthContext'
import { useUiSettings } from '@/shared/hooks'
import useLanguage from '@/shared/hooks/useLanguage'
import Navbar from '@/widgets/navbar/Navbar'

export default function MainLayout(): JSX.Element {
  useLanguage()
  const { token, logout } = useContext(AuthContext)
  const { settings, getBackgroundImageUrl } = useUiSettings()

  const isLoggedIn = Boolean(token)

  const backgroundStyle = settings.backgroundImage
    ? ({
        minHeight: '100vh',
        backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${getBackgroundImageUrl(settings.backgroundImage)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        position: 'relative',
      } as const)
    : ({ minHeight: '100vh', position: 'relative' } as const)

  return (
    <div style={backgroundStyle}>
      {/* Overlay rimosso: l'oscuramento è applicato via linear-gradient nello sfondo */}
      <div style={{ position: 'relative' }}>
        <Navbar isLoggedIn={isLoggedIn} onLogout={logout} />
      </div>
      <div style={{ paddingTop: 56, paddingBottom: 64, position: 'relative' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 12px', // Ridotto da 16px per mobile
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  )
}
