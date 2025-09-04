import type { SupportedLanguage } from '@/shared/libs/constants/languages'

import type { TranslationKey } from './types'

// Cache per le traduzioni caricate
const translationCache = new Map<SupportedLanguage, TranslationKey>()

/**
 * Carica le traduzioni per una lingua specifica
 * Utilizza il lazy loading e cache per performance
 */
export const loadTranslations = async (language: SupportedLanguage): Promise<TranslationKey> => {
  // Controllo cache prima
  const cached = translationCache.get(language)
  if (cached) {
    return cached
  }

  try {
    // Caricamento dinamico del file di traduzione
    let translations: TranslationKey

    switch (language) {
      case 'it':
        translations = (await import('./locales/it.json')).default as TranslationKey
        break
      case 'en':
        translations = (await import('./locales/en.json')).default as TranslationKey
        break
      case 'es':
        translations = (await import('./locales/es.json')).default as TranslationKey
        break
      default:
        // Fallback a inglese
        translations = (await import('./locales/en.json')).default as TranslationKey
    }

    // Salva in cache
    translationCache.set(language, translations)
    return translations
  } catch (error) {
    console.error(`Errore nel caricamento delle traduzioni per ${language}:`, error)

    // Fallback a inglese in caso di errore
    if (language !== 'en') {
      return loadTranslations('en')
    }

    // Se anche inglese fallisce, ritorna oggetto vuoto con struttura corretta
    throw new Error(`Impossibile caricare le traduzioni per ${language}`)
  }
}

/**
 * Ottiene una traduzione specifica usando una chiave annidata
 * Es: getNestedTranslation(translations, 'common.login') => translations.common.login
 */
export const getNestedTranslation = (translations: TranslationKey, key: string): string => {
  const keys = key.split('.')
  let value: unknown = translations

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k]
    } else {
      console.warn(`Chiave di traduzione non trovata: ${key}`)
      return key // Ritorna la chiave come fallback
    }
  }

  return typeof value === 'string' ? value : key
}

/**
 * Pulisce la cache delle traduzioni (utile per test o reset)
 */
export const clearTranslationCache = (): void => {
  translationCache.clear()
}

/**
 * Ottiene le lingue caricate nella cache
 */
export const getCachedLanguages = (): SupportedLanguage[] => {
  return Array.from(translationCache.keys())
}
