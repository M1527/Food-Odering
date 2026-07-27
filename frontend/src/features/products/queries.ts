import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getProducts } from './api'
import type { ProductsQuery } from './types'

export function useProducts(query: ProductsQuery) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: () => getProducts(query),
    placeholderData: keepPreviousData,
  })
}
