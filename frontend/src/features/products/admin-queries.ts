import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  createAdminProduct,
  getAdminProducts,
  updateAdminProduct,
} from './admin-api'
import type { ProductsQuery } from './types'

export function useAdminProducts(query: ProductsQuery) {
  return useQuery({
    queryKey: ['products', 'admin', query],
    queryFn: () => getAdminProducts(query),
    placeholderData: keepPreviousData,
  })
}

export function useCreateAdminProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAdminProduct,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['products'],
      }),
  })
}

export function useUpdateAdminProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAdminProduct,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['products'],
      }),
  })
}
