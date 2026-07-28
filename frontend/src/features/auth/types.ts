export type UserRole = 'GUEST' | 'USER' | 'ADMIN'

export type AuthUser = {
  id: number
  email: string
  fullName: string
  phone?: string
  role: UserRole
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = LoginInput & {
  fullName: string
  phone?: string
}

export type AuthResponse = {
  message: string
  user: AuthUser
  accessToken: string
  refreshToken: string
}

export type RefreshTokenResponse = {
  message: string
  accessToken: string
  refreshToken: string
}

export type AuthSession = {
  user: AuthUser
  accessToken: string
  refreshToken: string
}
