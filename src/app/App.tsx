// src/App.tsx
import { Suspense, type JSX } from 'react'

import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom'

import AuthProvider from '@/entities/user/AuthProvider'
import ProtectedRoute from '@/features/auth/ProtectedRoute'
import HomePage from '@/pages/HomePage'
import Login from '@/pages/auth/LoginPage'
import LoadingFallback from '@/shared/components/LoadingFallback'
import { ConsoleProvider } from '@/shared/contexts/ConsoleProvider'
import { I18nProvider } from '@/shared/libs/i18n'
import MainLayout from '@/widgets/layout/MainLayout'

import AppRoutes from './routing/AppRoutes'

export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <I18nProvider>
        <ConsoleProvider>
          <BrowserRouter>
            <Routes>
              {/* Tutte le pagine passano per MainLayout */}
              <Route element={<MainLayout />}>
                {/* pubbliche */}
                <Route path="/" element={<HomePage />} />
                <Route path="login" element={<Login />} />

                {/* protette sotto /app/* */}
                <Route
                  path="app/*"
                  element={
                    <ProtectedRoute>
                      {/* Outlet farà il render delle sotto‐route protette */}
                      <Suspense fallback={<LoadingFallback />}>
                        <Outlet />
                      </Suspense>
                    </ProtectedRoute>
                  }
                >
                  {/* qui monti le tue AppRoutes (console, dashboard, ecc.) */}
                  {AppRoutes()}
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </ConsoleProvider>
      </I18nProvider>
    </AuthProvider>
  )
}
