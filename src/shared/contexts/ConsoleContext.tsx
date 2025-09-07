import { createContext, useContext, useState, type ReactNode, type JSX } from 'react'

type ConsoleContextType = {
  output: string
  setOutput: (output: string | ((prev: string) => string)) => void
  clearOutput: () => void
}

const ConsoleContext = createContext<ConsoleContextType | null>(null)

export const useConsoleContext = (): ConsoleContextType => {
  const context = useContext(ConsoleContext)
  if (!context) {
    throw new Error("useConsoleContext deve essere usato all'interno di ConsoleProvider")
  }
  return context
}

type ConsoleProviderProps = {
  children: ReactNode
}

export const ConsoleProvider = ({ children }: ConsoleProviderProps): JSX.Element => {
  const [output, setOutput] = useState('')

  const clearOutput = () => setOutput('')

  return (
    <ConsoleContext.Provider value={{ output, setOutput, clearOutput }}>
      {children}
    </ConsoleContext.Provider>
  )
}
