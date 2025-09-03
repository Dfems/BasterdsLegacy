import type { UserRole } from './common'

export interface AuthContextType {
  token: string | null
  role: UserRole | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}
