import { http } from '../../lib/http'
import type {
  ProductResponse,
  ProductsQuery,
  ProductsResponse,
} from './types'

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

export async function getProduct(productId: number): Promise<ProductResponse> {
  const response = await http.get<ProductResponse>(`/products/${productId}`)

  return response.data
}
