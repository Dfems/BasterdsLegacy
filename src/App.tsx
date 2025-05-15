import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ConsolePage from './pages/ConsolePage';
import LanguageProvider from './contexts/LanguageProvider';
import MainLayout from './layout/MainLayout';
import './styles/App.css';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <Router>
        <MainLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/console" element={<ConsolePage />} />
            </Routes>
        </MainLayout>
      </Router>
    </LanguageProvider>
  );
};

export default App;