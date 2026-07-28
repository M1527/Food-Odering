import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
} from '../features/auth/storage'
import type { RefreshTokenResponse } from '../features/auth/types'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const http = axios.create({
  baseURL: apiUrl,
  timeout: 10_000,
  headers: {
    'Accept-Language': 'vi',
  },
})

type RetryableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean
}

let refreshRequest: Promise<string> | null = null

http.interceptors.request.use((config) => {
  const session = getAuthSession()

  if (session?.accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error)
    }

    const request = error.config as RetryableRequest | undefined
    const session = getAuthSession()

    if (
      error.response?.status !== 401 ||
      !request ||
      request._retry ||
      !session ||
      request.url?.endsWith('/users/logout')
    ) {
      return Promise.reject(error)
    }

    request._retry = true

    try {
      const accessToken = await refreshAccessToken()
      request.headers.Authorization = `Bearer ${accessToken}`

      return http(request)
    } catch (refreshError) {
      clearAuthSession()
      return Promise.reject(refreshError)
    }
  },
)

async function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = requestNewAccessToken().finally(() => {
      refreshRequest = null
    })
  }

  return refreshRequest
}

async function requestNewAccessToken() {
  const session = getAuthSession()

  if (!session) {
    throw new Error('Missing authentication session')
  }

  const response = await axios.post<RefreshTokenResponse>(
    `${apiUrl.replace(/\/$/, '')}/users/refresh-token`,
    {
      refreshToken: session.refreshToken,
    },
    {
      headers: {
        'Accept-Language': 'vi',
      },
    },
  )

  saveAuthSession({
    ...session,
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
  })

  return response.data.accessToken
}
