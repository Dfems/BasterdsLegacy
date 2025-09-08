import { useContext } from 'react'

import { ConsoleContext } from './consoleContext'

export const useConsoleContext = () => {
  const context = useContext(ConsoleContext)
  if (!context) {
    throw new Error("useConsoleContext deve essere usato all'interno di ConsoleProvider")
  }
  return context
}
