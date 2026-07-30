import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
} from './api'
import type { Cart, CartMutationResponse } from './types'

export const cartKey = (userId: number) => ['cart', userId] as const

export function useCart(userId?: number) {
  return useQuery({
    queryKey: cartKey(userId ?? 0),
    queryFn: getCart,
    enabled: Boolean(userId),
  })
}

export function useAddCartItem(userId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addCartItem,
    onSuccess: (response) => updateCartCache(queryClient, userId, response),
  })
}

export function useUpdateCartItem(userId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCartItem,
    onSuccess: (response) => updateCartCache(queryClient, userId, response),
  })
}

export function useRemoveCartItem(userId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeCartItem,
    onSuccess: (response) => updateCartCache(queryClient, userId, response),
  })
}

function updateCartCache(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: number,
  response: CartMutationResponse,
) {
  queryClient.setQueryData<Cart>(cartKey(userId), response.cart)
}
