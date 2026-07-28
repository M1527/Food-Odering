import { useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

import {
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from './api'
import { AuthContext } from './auth-context'
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
} from './storage'
import type { AuthSession, LoginInput, RegisterInput } from './types'

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getAuthSession(),
  )

  useEffect(() => {
    function syncSession() {
      setSession(getAuthSession())
    }

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession)
    window.addEventListener('storage', syncSession)

    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession)
      window.removeEventListener('storage', syncSession)
    }
  }, [])

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      async login(input: LoginInput) {
        const response = await loginRequest(input)
        saveAuthSession(response)
      },
      async register(input: RegisterInput) {
        const response = await registerRequest(input)
        saveAuthSession(response)
      },
      async logout() {
        try {
          if (session?.refreshToken) {
            await logoutRequest(session.refreshToken)
          }
        } finally {
          clearAuthSession()
        }
      },
    }),
    [session],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
