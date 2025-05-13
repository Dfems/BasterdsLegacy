import React, { createContext } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
  translations: Record<string, Record<string, string>>; // Define a more specific type for translations
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);