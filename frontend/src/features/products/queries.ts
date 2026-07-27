import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getProduct, getProducts } from './api'
import type { ProductsQuery } from './types'

export function useProducts(query: ProductsQuery) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: () => getProducts(query),
    placeholderData: keepPreviousData,
  })
}

export function useProduct(productId: number) {
  return useQuery({
    queryKey: ['products', 'detail', productId],
    queryFn: () => getProduct(productId),
    enabled: Number.isInteger(productId) && productId > 0,
  })
}
