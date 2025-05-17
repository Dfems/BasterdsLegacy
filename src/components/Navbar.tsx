import { Link } from 'react-router-dom';
import type { JSX } from 'react';
import useLanguage from '../hooks/useLanguage';
import '../styles/App.css';

interface NavbarProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

export default function Navbar({ isLoggedIn, onLogout }: NavbarProps): JSX.Element {
  const { t } = useLanguage();

  return (
    <nav className='navbar'>
      <div>
        <Link to="/" style={{ color: '#61dafb', textDecoration: 'none', fontWeight: 'bold' }}>
          {t.appName}
        </Link>
      </div>
      <ul style={{ listStyle: 'none', display: 'flex', gap: '1rem', margin: 0, padding: 0 }}>
        <li>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>
            Home
          </Link>
        </li>
        {isLoggedIn ? (
          <>
            <li>
              <Link to="/app/console" style={{ color: '#fff', textDecoration: 'none' }}>
                Console
              </Link>
            </li>
            <li>
              <button
                onClick={onLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid #61dafb',
                  borderRadius: '4px',
                  color: '#61dafb',
                  padding: '0.25rem 0.5rem',
                  cursor: 'pointer'
                }}
              >
                Disconnect
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link to="/login" style={{ color: '#fff', textDecoration: 'none' }}>
              {t.loginTitle}
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
