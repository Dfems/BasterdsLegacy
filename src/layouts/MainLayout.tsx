// src/layouts/MainLayout.tsx
import React, { useState, type JSX } from 'react';
import { Outlet } from 'react-router-dom';
import useLanguage from '../hooks/useLanguage';
import Navbar from '../components/Navbar';
import MainLayoutContext from '../contexts/MainLayoutContext';

export default function MainLayout(): JSX.Element {
  const { language, setLanguage } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  return (
    <MainLayoutContext.Provider value={{ handleLogin }}>
      <div>
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <div style={{ marginTop: '60px' }}>
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
    </MainLayoutContext.Provider>
  );
}
