import { useState, type JSX, type ReactNode } from 'react'

import { ConsoleContext } from './consoleContext'

// context type and instance are defined in ./consoleContext

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
