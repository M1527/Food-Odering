import { http } from '../../lib/http'
import type { ReviewsQuery, ReviewsResponse } from './types'

export async function getProductReviews(
  productId: number,
  query: ReviewsQuery,
): Promise<ReviewsResponse> {
  const response = await http.get<ReviewsResponse>(
    `/products/${productId}/reviews`,
    {
      params: query,
    },
  )

  return response.data
}
