import { createContext } from 'react'

import type { AuthContextType } from '@/types/auth'

// Context con valore di default: tutte le funzioni “no-op”
const AuthContext = createContext<AuthContextType>({
  token: null,
  role: null,
  login: () => Promise.reject(),
  logout: () => {
    /* no-op */
  },
})

export default AuthContext
