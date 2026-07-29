import { http } from '../../lib/http'
import type {
  AddCartItemInput,
  Cart,
  CartMutationResponse,
  UpdateCartItemInput,
} from './types'

export async function getCart(): Promise<Cart> {
  const response = await http.get<Cart>('/cart')

  return response.data
}

export async function addCartItem(
  input: AddCartItemInput,
): Promise<CartMutationResponse> {
  const response = await http.post<CartMutationResponse>('/cart/items', input)

  return response.data
}

export async function updateCartItem({
  productId,
  quantity,
}: UpdateCartItemInput): Promise<CartMutationResponse> {
  const response = await http.patch<CartMutationResponse>(
    `/cart/items/${productId}`,
    {
      quantity,
    },
  )

  return response.data
}

export async function removeCartItem(
  productId: number,
): Promise<CartMutationResponse> {
  const response = await http.delete<CartMutationResponse>(
    `/cart/items/${productId}`,
  )

  return response.data
}
