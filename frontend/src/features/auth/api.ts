import { http } from '../../lib/http'
import type { AuthResponse, LoginInput, RegisterInput } from './types'

export async function login(input: LoginInput): Promise<AuthResponse> {
  const response = await http.post<AuthResponse>('/users/login', input)

  return response.data
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const response = await http.post<AuthResponse>('/users', input)

  return response.data
}

export async function logout(refreshToken: string): Promise<void> {
  await http.post('/users/logout', {
    refreshToken,
  })
}
