import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getProductReviews } from './api'
import type { ReviewsQuery } from './types'

export function useProductReviews(productId: number, query: ReviewsQuery) {
  return useQuery({
    queryKey: ['products', productId, 'reviews', query],
    queryFn: () => getProductReviews(productId, query),
    enabled: Number.isInteger(productId) && productId > 0,
    placeholderData: keepPreviousData,
  })
}
