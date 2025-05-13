import React, { useState } from 'react';
import { LanguageContext } from './createContext';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('it');
  const translations = {
    it: {
      title: 'Dfems & WillPipper Craft',
      welcome: 'Benvenuto su Dfems & WillPipper Craft!',
      instructions: 'Segui le istruzioni per connetterti al nostro server:',
      configBtn: 'Scarica Configurazione',
      launcherBtn: 'Scarica Launcher',
      donateBtn: 'Abbonamenti',
      footer: '© 2025 Dfems. Tutti i diritti riservati.',
      modalTitle: 'Verifica Whitelist',
      modalNameLabel: 'Nome',
      modalNamePlaceholder: 'Inserisci il tuo nome',
      modalUsernameLabel: 'Username Minecraft',
      modalUsernamePlaceholder: 'Inserisci username Minecraft',
      modalSubmitBtn: 'Verifica e Scarica',
      modalCancelBtn: 'Annulla',
      modalError: 'Non sei nella whitelist e non puoi scaricare.',
      loginTitle: 'Login e Controllo Server',
      passwordLabel: 'Password:',
      commandLabel: 'Comando Server:',
      consoleTitle: 'Console Server:',
      backToHome: 'Torna alla Home',
    },
    en: {
      title: 'Dfems & WillPipper Craft',
      welcome: 'Welcome to Dfems & WillPipper Craft!',
      instructions: 'Follow the instructions to connect to our server:',
      configBtn: 'Download Configuration',
      launcherBtn: 'Download Launcher',
      donateBtn: 'Subscription',
      footer: '© 2025. All rights reserved.',
      modalTitle: 'Whitelist Check',
      modalNameLabel: 'Name',
      modalNamePlaceholder: 'Enter your name',
      modalUsernameLabel: 'Minecraft Username',
      modalUsernamePlaceholder: 'Enter Minecraft username',
      modalSubmitBtn: 'Verify & Download',
      modalCancelBtn: 'Cancel',
      modalError: 'You are not whitelisted and cannot download.',
      loginTitle: 'Login and Server Control',
      passwordLabel: 'Password:',
      commandLabel: 'Server Command:',
      consoleTitle: 'Server Console:',
      backToHome: 'Back to Home',
    },
    es: {
      title: 'Dfems & WillPipper Craft',
      welcome: '¡Bienvenido a Dfems & WillPipper Craft!',
      instructions: 'Sigue las instrucciones para conectarte a nuestro servidor:',
      configBtn: 'Descargar configuración',
      launcherBtn: 'Descargar launcher',
      donateBtn: 'Suscripción',
      footer: '© 2025. Todos los derechos reservados.',
      modalTitle: 'Verificación Whitelist',
      modalNameLabel: 'Nombre',
      modalNamePlaceholder: 'Introduce tu nombre',
      modalUsernameLabel: 'Usuario Minecraft',
      modalUsernamePlaceholder: 'Introduce usuario Minecraft',
      modalSubmitBtn: 'Verificar y Descargar',
      modalCancelBtn: 'Cancelar',
      modalError: 'No estás en la whitelist y no puedes descargar.',
      loginTitle: 'Inicio de Sesión y Control del Servidor',
      passwordLabel: 'Contraseña:',
      commandLabel: 'Comando del Servidor:',
      consoleTitle: 'Consola del Servidor:',
      backToHome: 'Volver al Inicio',
    },
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export { LanguageContext };

