export const SUPPORTED_LANGUAGES = [
  { value: 'it', label: 'Italiano' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
] satisfies Array<{ value: string; label: string }>

export const DEFAULT_LANGUAGE = 'es' as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['value']
