import { createContext } from 'react'

export type ConsoleContextType = {
  output: string
  setOutput: (output: string | ((prev: string) => string)) => void
  clearOutput: () => void
}

export const ConsoleContext = createContext<ConsoleContextType | null>(null)
