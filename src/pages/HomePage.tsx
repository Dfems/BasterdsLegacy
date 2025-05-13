import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/App.css';
import { useLanguage } from '../contexts/useLanguage';

const HomePage: React.FC = () => {
  const { language, translations } = useLanguage();
  const t = translations[language];

  return (
    <div className="container">
      <h1 id="server-title">{t.title}</h1>
      <p id="welcome-text" className="instructions">{t.welcome}</p>
      <p id="instructions-text" className="instructions">{t.instructions}</p>
      <ul className="links">
        <li>
          <a id="config-btn" className="btn" href="dfemscraft-config.zip" download="dfemscraft-config.zip">
            {t.configBtn}
          </a>
        </li>
        <li>
          <a id="launcher-btn" className="btn" href="dfemscraft-launcher.jar" download="dfemscraft-launcher.jar">
            {t.launcherBtn}
          </a>
        </li>
        <li>
          <a id="donate-btn" className="btn" href="https://example.com/donate" target="_blank" onClick={() => alert('Work In Progress!')}>
            {t.donateBtn}
          </a>
        </li>
        <li>
          <Link to="/login" className="btn">
            {t.loginTitle}
          </Link>
        </li>
      </ul>
      <footer id="footer-text">{t.footer}</footer>
    </div>
  );
};

export default HomePage;