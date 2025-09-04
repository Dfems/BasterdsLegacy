import { createContext } from 'react'

import type { I18nContextType } from './types'

// Crea il context
export const I18nContext = createContext<I18nContextType | undefined>(undefined)
