import React from 'react';
import { useLanguage } from '../contexts/useLanguage';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  return (
    <div>
      {children}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
        <select value={language} onChange={handleLanguageChange}>
          <option value="it">Italiano</option>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
    </div>
  );
};

export default MainLayout;