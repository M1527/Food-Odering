import { http } from '../../lib/http'
import type {
  CreateReviewInput,
  CreateReviewResponse,
  ReviewsQuery,
  ReviewsResponse,
} from './types'

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

export async function createProductReview(
  productId: number,
  input: CreateReviewInput,
): Promise<CreateReviewResponse> {
  const response = await http.post<CreateReviewResponse>(
    `/products/${productId}/reviews`,
    input,
  )

  return response.data
}
