import type { Dispatch, SetStateAction } from 'react'

import type { SupportedLanguage } from '@/shared/libs/constants/languages'

import type { Translations } from './translationTypes'

export interface LanguageContextType {
  language: SupportedLanguage
  setLanguage: Dispatch<SetStateAction<SupportedLanguage>>
  translations: Translations
}
