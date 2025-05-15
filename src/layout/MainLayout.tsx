import React, { useState } from 'react';
import useLanguage from '../hooks/useLanguage';
import Navbar from '../components/Navbar';
import MainLayoutContext from '../contexts/MainLayoutContext'; // Importa il contesto

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, setLanguage } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  return (
    <MainLayoutContext.Provider value={{ handleLogin }}> {/* Fornisci il contesto */}
      <div>
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <div style={{ marginTop: '60px' }}>
          {children}
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
};

export default MainLayout;