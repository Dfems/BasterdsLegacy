import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useLanguage from '../hooks/useLanguage';

interface NavbarProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isLoggedIn, onLogout }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleDisconnect = () => {
    onLogout();
    navigate('/');
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      backgroundColor: '#222',
      padding: '10px',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      zIndex: 1000,
    }}>
      <NavLink
        to="/"
        style={({ isActive }) => ({
          color: isActive ? '#FFD700' : '#0F0',
          textDecoration: 'none',
          fontFamily: 'Press Start 2P',
          fontSize: '0.8rem',
        })}
      >
        Home
      </NavLink>
      {isLoggedIn ? (
        <NavLink
          to="/" // Reindirizza alla Home (o a dove vuoi)
          onClick={handleDisconnect}
          style={({ isActive }) => ({
            color: isActive ? '#FFD700' : '#f44336', // Stile rosso per "Disconnect"
            textDecoration: 'none',
            fontFamily: 'Press Start 2P',
            fontSize: '0.8rem',
          })}
        >
          Disconnect
        </NavLink>
      ) : (
        <NavLink
          to="/login"
          style={({ isActive }) => ({
            color: isActive ? '#FFD700' : '#0F0',
            textDecoration: 'none',
            fontFamily: 'Press Start 2P',
            fontSize: '0.8rem',
          })}
        >
          {t.loginTitle}
        </NavLink>
      )}
    </nav>
  );
};

export default Navbar;