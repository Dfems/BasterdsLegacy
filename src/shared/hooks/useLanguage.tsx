import { useContext } from 'react'

import LanguageContext from '@/entities/language/LanguageContext'
import type { SupportedLanguage } from '@/shared/libs/constants/languages'
import type { Translations } from '@/types/translationTypes'

interface UseLanguageReturnType {
  language: SupportedLanguage
  setLanguage: React.Dispatch<React.SetStateAction<SupportedLanguage>>
  translations: Translations
  t: Translations[string]
}

const useLanguage = (): UseLanguageReturnType => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  const { language, setLanguage, translations } = context
  const t: Translations[string] = translations[language] ?? {}
  return { language, setLanguage, translations, t }
}

export default useLanguage
