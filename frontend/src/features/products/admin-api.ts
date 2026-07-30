import { http } from '../../lib/http'
import type {
  ProductResponse,
  ProductsQuery,
  ProductsResponse,
  UpdateAdminProductInput,
} from './types'

export async function getAdminProducts(
  query: ProductsQuery,
): Promise<ProductsResponse> {
  const response = await http.get<ProductsResponse>('/products', {
    params: query,
  })

  return response.data
}

export async function createAdminProduct(
  formData: FormData,
): Promise<ProductResponse> {
  const response = await http.post<ProductResponse>(
    '/admin/products',
    formData,
    {
      timeout: 30_000,
    },
  )

  return response.data
}

export async function updateAdminProduct({
  productId,
  formData,
}: UpdateAdminProductInput): Promise<ProductResponse> {
  const response = await http.patch<ProductResponse>(
    `/admin/products/${productId}`,
    formData,
    {
      timeout: 30_000,
    },
  )

  return response.data
}
