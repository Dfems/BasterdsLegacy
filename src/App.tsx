// src/App.tsx
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import type { JSX } from 'react';
import AuthProvider from './contexts/AuthProvider';
import LanguageProvider from './contexts/LanguageProvider';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import Login from './pages/LoginPage';      
import AppRoutes from './routes/AppRoutes';

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
                    <Outlet />
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
  );
}
