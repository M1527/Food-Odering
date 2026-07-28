import { createContext } from 'react'

import type { AuthUser, LoginInput, RegisterInput } from './types'

export type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
