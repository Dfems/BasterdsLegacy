import { useState, type JSX, type ReactNode } from 'react'

import { DEFAULT_LANGUAGE, type SupportedLanguage } from '@/shared/libs/constants/languages'

import LanguageContext from './LanguageContext'

const LanguageProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [language, setLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE)

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations: {} as never }}>
      {children}
    </LanguageContext.Provider>
  )
}

export default LanguageProvider
