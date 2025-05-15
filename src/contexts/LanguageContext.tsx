import { createContext } from 'react';
import type { LanguageContextType } from './LanguageContextTypes';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export default LanguageContext;