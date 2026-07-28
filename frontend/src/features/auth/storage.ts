import type { AuthSession } from './types'

const AUTH_SESSION_KEY = 'food-ordering-auth'

export const AUTH_SESSION_CHANGED_EVENT = 'auth-session-changed'

export function getAuthSession(): AuthSession | null {
  const rawSession = localStorage.getItem(AUTH_SESSION_KEY)

  if (!rawSession) {
    return null
  }

  try {
    const session = JSON.parse(rawSession) as AuthSession

    if (
      !session.accessToken ||
      !session.refreshToken ||
      !session.user?.id
    ) {
      clearAuthSession()
      return null
    }

    return session
  } catch {
    clearAuthSession()
    return null
  }
}

export function saveAuthSession(session: AuthSession) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_SESSION_KEY)
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT))
}
