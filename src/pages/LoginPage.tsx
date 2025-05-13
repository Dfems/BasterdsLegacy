import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/useLanguage';

const LoginPage: React.FC = () => {
  const { language, translations } = useLanguage();
  const t = translations[language];
  const [command, setCommand] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');

  const executeCommand = async () => {
    setConsoleOutput(`Eseguito comando: ${command}\nOutput: Server avviato con successo!`);
  };

  return (
    <div className="container">
      <h1>{t.loginTitle}</h1>
      <div>
        <label htmlFor="password">{t.passwordLabel}</label>
        <input type="password" id="password" />
      </div>
      <div>
        <label htmlFor="command">{t.commandLabel}</label>
        <input
          type="text"
          id="command"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
        />
        <button onClick={executeCommand}>Esegui</button>
      </div>
      <div>
        <h2>{t.consoleTitle}</h2>
        <textarea value={consoleOutput} readOnly rows={10} cols={50} />
      </div>
      <Link to="/" className="btn">
        {t.backToHome}
      </Link>
    </div>
  );
};

export default LoginPage;