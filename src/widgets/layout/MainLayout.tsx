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
    ? {
        backgroundImage: `url(${getBackgroundImageUrl(settings.backgroundImage)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }
    : {}

  return (
    <div style={backgroundStyle}>
      {/* Overlay for better readability when background is set */}
      {settings.backgroundImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: -1,
          }}
        />
      )}
      <Navbar isLoggedIn={isLoggedIn} onLogout={logout} />
      <div style={{ paddingTop: 56, paddingBottom: 64 }}>
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
