// Esportazioni principali per il sistema i18n
export { I18nProvider } from './provider'
export { I18nContext } from './context'
export { useTranslation } from './hook'
export {
  loadTranslations,
  getNestedTranslation,
  clearTranslationCache,
  getCachedLanguages,
} from './utils'

// Esportazioni dei tipi
export type {
  TranslationKey,
  LoadedTranslations,
  UseTranslationReturnType,
  I18nContextType,
} from './types'
