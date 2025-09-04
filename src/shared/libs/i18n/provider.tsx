import { useCallback, useEffect, useState, type JSX, type ReactNode } from 'react'

import { DEFAULT_LANGUAGE, type SupportedLanguage } from '@/shared/libs/constants/languages'

import { I18nContext } from './context'
import type { I18nContextType, LoadedTranslations } from './types'
import { loadTranslations } from './utils'

interface I18nProviderProps {
  children: ReactNode
}

/**
 * Provider per l'internazionalizzazione con lazy loading
 * Carica solo le traduzioni necessarie per migliorare le performance
 */
export const I18nProvider = ({ children }: I18nProviderProps): JSX.Element => {
  const [language, setLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE)
  const [translations, setTranslations] = useState<Partial<LoadedTranslations>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Funzione per caricare le traduzioni
  const loadTranslationsForLanguage = useCallback(
    async (lang: SupportedLanguage) => {
      // Se già caricate, non ricaricare
      if (translations[lang]) {
        return
      }

      setIsLoading(true)
      try {
        const loadedTranslations = await loadTranslations(lang)
        setTranslations((prev) => ({
          ...prev,
          [lang]: loadedTranslations,
        }))
      } catch (error) {
        console.error(`Errore nel caricamento delle traduzioni per ${lang}:`, error)
      } finally {
        setIsLoading(false)
      }
    },
    [translations]
  )

  // Carica le traduzioni al mount e quando cambia la lingua
  useEffect(() => {
    loadTranslationsForLanguage(language)
  }, [language, loadTranslationsForLanguage])

  // Precarica la lingua inglese come fallback se non è già quella attiva
  useEffect(() => {
    if (language !== 'en' && !translations.en) {
      loadTranslations('en')
        .then((englishTranslations) => {
          setTranslations((prev) => ({
            ...prev,
            en: englishTranslations,
          }))
        })
        .catch((error) => {
          console.error('Errore nel precaricamento inglese:', error)
        })
    }
  }, [language, translations.en])

  const contextValue: I18nContextType = {
    language,
    setLanguage,
    translations,
    isLoading,
    loadTranslations: loadTranslationsForLanguage,
  }

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
}
