import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
            {/* PUBBLICHE */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />

            {/* PROTETTE sotto /app/* */}
            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  {/* qui avvolgi la navbar + switch lingua */}
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* monta qui dentro tutte le tue AppRoutes */}
              {AppRoutes()}
            </Route>
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}
