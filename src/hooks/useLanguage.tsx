import { useContext } from 'react';
import LanguageContext from '../contexts/LanguageContext';
import type { Translations } from '../types/translationTypes';

interface UseLanguageReturnType {
  language: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
  translations: Translations;
  t: Translations[string];
}

const useLanguage = (): UseLanguageReturnType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  const { language, setLanguage, translations } = context;
  const t = translations[language];
  return { language, setLanguage, translations, t };
};

export default useLanguage;