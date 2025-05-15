import type { Dispatch, SetStateAction } from 'react';
import type { Translations } from '../types/translationTypes';

export interface LanguageContextType {
  language: string;
  setLanguage: Dispatch<SetStateAction<string>>;
  translations: Translations;
}