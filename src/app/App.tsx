// src/App.tsx
import { Suspense, type JSX } from 'react'

import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom'

import LanguageProvider from '@/entities/language/LanguageProvider'
import AuthProvider from '@/entities/user/AuthProvider'
import ProtectedRoute from '@/features/auth/ProtectedRoute'
import HomePage from '@/pages/HomePage'
import Login from '@/pages/auth/LoginPage'
import MainLayout from '@/widgets/layout/MainLayout'

import AppRoutes from './routing/AppRoutes'

export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <LanguageProvider>
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
                    <Suspense fallback={<div style={{ padding: 16 }}>Caricamento…</div>}>
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
      </LanguageProvider>
    </AuthProvider>
  )
}
