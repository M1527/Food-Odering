import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { createProductReview, getProductReviews } from './api'
import type { CreateReviewInput, ReviewsQuery } from './types'

export function useProductReviews(productId: number, query: ReviewsQuery) {
  return useQuery({
    queryKey: ['products', productId, 'reviews', query],
    queryFn: () => getProductReviews(productId, query),
    enabled: Number.isInteger(productId) && productId > 0,
    placeholderData: keepPreviousData,
  })
}

export function useCreateProductReview(productId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateReviewInput) =>
      createProductReview(productId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['products'],
      })
    },
  })
}
