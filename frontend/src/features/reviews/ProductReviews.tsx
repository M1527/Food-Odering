import { useEffect, useState } from 'react'

import { useAuth } from '../auth/useAuth'
import { formatDate } from '../../lib/format'
import { ProductReviewForm } from './ProductReviewForm'
import { useProductReviews } from './queries'

const REVIEWS_PER_PAGE = 5

type ProductReviewsProps = {
  productId: number
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const reviewsQuery = useProductReviews(productId, {
    page,
    limit: REVIEWS_PER_PAGE,
  })

  const totalPages = reviewsQuery.data
    ? Math.max(1, Math.ceil(reviewsQuery.data.total / REVIEWS_PER_PAGE))
    : 1
  const hasReviewed =
    reviewsQuery.data?.reviews.some(
      (review) => review.user.id === user?.id,
    ) ?? false

  useEffect(() => {
    if (window.location.hash !== '#reviews') {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      document
        .getElementById('reviews')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [])

  return (
    <section className="reviews-section" id="reviews">
      <div className="product-section-heading">
        <h2>Đánh giá sản phẩm</h2>
        {reviewsQuery.data && <span>{reviewsQuery.data.total} đánh giá</span>}
      </div>

      <ProductReviewForm
        productId={productId}
        hasReviewed={hasReviewed}
      />

      {reviewsQuery.isPending && <p>Đang tải đánh giá...</p>}

      {reviewsQuery.isError && (
        <div className="error-state" role="alert">
          <p>Không thể tải đánh giá của sản phẩm.</p>
          <button type="button" onClick={() => void reviewsQuery.refetch()}>
            Thử lại
          </button>
        </div>
      )}

      {reviewsQuery.data && reviewsQuery.data.reviews.length === 0 && (
        <p>Sản phẩm này chưa có đánh giá.</p>
      )}

      {reviewsQuery.data && reviewsQuery.data.reviews.length > 0 && (
        <>
          <ul
            className={`review-list ${
              reviewsQuery.isFetching ? 'is-fetching' : ''
            }`}
          >
            {reviewsQuery.data.reviews.map((review) => (
              <li className="review-card" key={review.id}>
                <div className="review-heading">
                  <div>
                    <strong>{review.user.fullName}</strong>
                    <div
                      className="review-stars"
                      aria-label={`${review.rating} trên 5 sao`}
                    >
                      {'★'.repeat(review.rating)}
                      <span>{'☆'.repeat(5 - review.rating)}</span>
                    </div>
                  </div>
                  <time dateTime={review.createdAt}>
                    {formatDate(review.createdAt)}
                  </time>
                </div>
                <p>{review.comment}</p>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Phân trang đánh giá">
              <button
                type="button"
                disabled={page === 1 || reviewsQuery.isFetching}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              >
                Trang trước
              </button>
              <span>
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page === totalPages || reviewsQuery.isFetching}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                Trang sau
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
