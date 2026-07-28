import { http } from '../../lib/http'
import type { CategoriesResponse } from './types'

export async function getCategories(): Promise<CategoriesResponse> {
  const response = await http.get<CategoriesResponse>('/categories')

  return response.data
}
