import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import './styles/App.css';
import { LanguageProvider } from './contexts/LanguageContext';
import MainLayout from './layout/MainLayout';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MainLayout>
      </Router>
    </LanguageProvider>
  );
};

export default App;