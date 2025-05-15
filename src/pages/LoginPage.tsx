import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useLanguage from '../hooks/useLanguage';
import useMainLayout from '../hooks/useMainLayout'; // Importa l'hook useMainLayout

const LoginPage: React.FC = () => {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { handleLogin } = useMainLayout(); // Usa l'hook per accedere a handleLogin

  const handleLoginClick = () => {
    // Qui dovresti implementare la logica di autenticazione
    // (ad esempio, una chiamata a un'API).
    // Per ora, simuleremo un login riuscito con qualsiasi password.
    if (password) {
      // Login riuscito
      if (handleLogin) {
        handleLogin(); // Chiama la funzione di login dall'hook
      }
      navigate('/console');
    } else {
      // Login fallito
      alert(t.passwordIncorrect); // Usa la traduzione per il messaggio di errore
    }
  };

  return (
    <div className="container">
      <h1>{t.loginTitle}</h1>
      <div>
        <label htmlFor="password">{t.passwordLabel}</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button onClick={handleLoginClick}>Login</button>
    </div>
  );
};

export default LoginPage;