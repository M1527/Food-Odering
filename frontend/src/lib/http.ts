import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  timeout: 10_000,
  headers: {
    'Accept-Language': 'vi',
  },
})
