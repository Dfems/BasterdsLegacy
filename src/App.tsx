// src/App.tsx
import { Suspense, type JSX } from 'react'

import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import AuthProvider from './contexts/AuthProvider'
import LanguageProvider from './contexts/LanguageProvider'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import Login from './pages/LoginPage'
import AppRoutes from './routes/AppRoutes'

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
