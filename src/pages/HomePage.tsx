import React from 'react'

import useLanguage from '../hooks/useLanguage'
import '../styles/App.css'

const HomePage: React.FC = () => {
  const { t } = useLanguage()

  return (
    <div className="container-md">
      <h1 id="server-title">{t.title}</h1>
      <div id="welcome-message">
        <p>{t.welcomePart}</p>
      </div>
      <br></br>
      {/* <p id="instructions-text" className="instructions">{t.instructions}</p> */}
      <ul className="links">
        <li>
          <a
            id="config-btn"
            className="btn"
            href="dfemscraft-config.zip"
            download="dfemscraft-config.zip"
          >
            {t.configBtn}
          </a>
        </li>
        <li>
          <a
            id="launcher-btn"
            className="btn"
            href="dfemscraft-launcher.jar"
            download="dfemscraft-launcher.jar"
          >
            {t.launcherBtn}
          </a>
        </li>
        <li>
          <a
            id="donate-btn"
            className="btn"
            href="https://example.com/donate"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.donateBtn}
          </a>
        </li>
        {/* <li>
          <Link to="/login" className="btn">
            {t.loginTitle}
          </Link>
        </li> */}
      </ul>
      <footer id="footer-text">{t.footer}</footer>
    </div>
  )
}

export default HomePage
