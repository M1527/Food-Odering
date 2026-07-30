export type ReviewUser = {
  id: number
  fullName: string
}

export type Review = {
  id: number
  rating: number
  comment: string
  user: ReviewUser
  productId: number
  createdAt: string
}

export type ReviewsQuery = {
  page: number
  limit: number
}

export type ReviewsResponse = {
  message: string
  reviews: Review[]
  total: number
}

export type CreateReviewInput = {
  rating: number
  comment: string
}

export type CreateReviewResponse = {
  message: string
  review: Review
}
