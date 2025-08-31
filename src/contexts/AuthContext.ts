import { createContext } from 'react'

export interface AuthContextType {
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

// Context con valore di default: tutte le funzioni “no-op”
const AuthContext = createContext<AuthContextType>({
  token: null,
  login: () => Promise.reject(),
  logout: () => {
    /* no-op */
  },
})

export default AuthContext
