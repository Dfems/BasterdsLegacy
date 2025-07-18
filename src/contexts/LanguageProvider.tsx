import React, { useState } from 'react';
import LanguageContext from './LanguageContext';
import type { Translations } from '../types/translationTypes';

const translations: Translations = {
  it: {
    appName: 'Minecraft',
    title: 'Basterd\'s Legacy!',
    welcomePart: 'Preparatevi a un\'esperienza unica e imprevedibile: un immenso multiverso con qualche mod selezionata per rendere le cose ancora più... interessanti 😉',
    instructions: 'Segui le istruzioni per connetterti al nostro server:',
    configBtn: 'Scarica Configurazione',
    launcherBtn: 'Scarica Launcher',
    donateBtn: 'Abbonamenti',
    footer: '© Dfems 2025. Tutti i diritti riservati.',
    modalTitle: 'Verifica Whitelist',
    modalNameLabel: 'Nome',
    modalNamePlaceholder: 'Inserisci il tuo nome',
    modalUsernameLabel: 'Username Minecraft',
    modalUsernamePlaceholder: 'Inserisci username Minecraft',
    modalSubmitBtn: 'Verifica e Scarica',
    modalCancelBtn: 'Annulla',
    modalError: 'Non sei nella whitelist e non puoi scaricare.',
    loginTitle: 'Login',
    passwordLabel: 'Password:',
    passwordIncorrect: 'Password incorretta.',
    commandLabel: 'Comando Server:',
    consoleTitle: 'Console Server:',
    backToHome: 'Torna alla Home',
    consoleLoginMessage: 'Effettua il login per accedere alla console.',
  },
  en: {
    appName: 'Minecraft',
    title: 'Basterd\'s Legacy!',
    welcomePart: 'Get ready for a unique and unpredictable experience: a huge multiverse with some selected mods to make things even more... interesting 😉',
    instructions: 'Follow the instructions to connect to our server:',
    configBtn: 'Download Configuration',
    launcherBtn: 'Download Launcher',
    donateBtn: 'Subscription',
    footer: '© Dfems 2025. All rights reserved.',
    modalTitle: 'Whitelist Check',
    modalNameLabel: 'Name',
    modalNamePlaceholder: 'Enter your name',
    modalUsernameLabel: 'Minecraft Username',
    modalUsernamePlaceholder: 'Enter Minecraft username',
    modalSubmitBtn: 'Verify & Download',
    modalCancelBtn: 'Cancel',
    modalError: 'You are not whitelisted and cannot download.',
    loginTitle: 'Login',
    passwordLabel: 'Password:',
    passwordIncorrect: 'Incorrect password.',
    commandLabel: 'Server Command:',
    consoleTitle: 'Server Console:',
    backToHome: 'Back to Home',
    consoleLoginMessage: 'Log in to access the console.',
  },
  es: {
    appName: 'Minecraft',
    title: 'Basterd\'s Legacy',
    welcomePart: 'Prepárense para una experiencia única e impredecible: un inmenso multiverso con algunos mods seleccionados para hacer las cosas aún más... interesantes 😉',
    instructions: 'Sigue las instrucciones para conectarte a nuestro servidor:',
    configBtn: 'Descargar configuración',
    launcherBtn: 'Descargar launcher',
    donateBtn: 'Suscripción',
    footer: '© Dfems 2025. Todos los derechos reservados.',
    modalTitle: 'Verificación Whitelist',
    modalNameLabel: 'Nombre',
    modalNamePlaceholder: 'Introduce tu nombre',
    modalUsernameLabel: 'Usuario Minecraft',
    modalUsernamePlaceholder: 'Introduce usuario Minecraft',
    modalSubmitBtn: 'Verificar y Descargar',
    modalCancelBtn: 'Cancelar',
    modalError: 'No estás en la whitelist y no puedes descargar.',
    loginTitle: 'Login',
    passwordLabel: 'Contraseña:',
    passwordIncorrect: 'Contraseña incorrecta.',
    commandLabel: 'Comando del Servidor:',
    consoleTitle: 'Consola del Servidor',
    backToHome: 'Volver al Inicio',
    consoleLoginMessage: 'Inicia sesión para acceder a la consola.',
  },
};

const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('es');

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;