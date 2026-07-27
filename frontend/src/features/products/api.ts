import { http } from '../../lib/http'
import type { ProductsQuery, ProductsResponse } from './types'

export async function getProducts(
  query: ProductsQuery,
): Promise<ProductsResponse> {
  const response = await http.get<ProductsResponse>('/products', {
    params: {
      ...query,
      status: 'ACTIVE',
    },
  })

  return response.data
}
