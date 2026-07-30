import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useLocation } from 'react-router'
import { z } from 'zod'

import { getApiErrorMessage } from '../../lib/api-error'
import { useAuth } from '../auth/useAuth'
import { useCreateProductReview } from './queries'

const reviewSchema = z.object({
  rating: z.coerce
    .number()
    .int()
    .min(1, 'Vui lòng chọn số sao.')
    .max(5, 'Điểm đánh giá không hợp lệ.'),
  comment: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập nội dung đánh giá.')
    .max(2000, 'Đánh giá không được vượt quá 2000 ký tự.'),
})

type ReviewFormInput = z.input<typeof reviewSchema>
type ReviewFormValues = z.output<typeof reviewSchema>

type ProductReviewFormProps = {
  productId: number
  hasReviewed: boolean
}

export function ProductReviewForm({
  productId,
  hasReviewed,
}: ProductReviewFormProps) {
  const { user } = useAuth()
  const location = useLocation()
  const createReview = useCreateProductReview(productId)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ReviewFormInput, unknown, ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: '',
    },
  })
  const selectedRating = Number(
    useWatch({
      control,
      name: 'rating',
    }),
  )

  if (!user) {
    return (
      <div className="review-form-note">
        <Link
          to="/login"
          state={{ from: `${location.pathname}${location.hash}` }}
        >
          Đăng nhập
        </Link>{' '}
        để đánh giá sản phẩm đã mua.
      </div>
    )
  }

  if (hasReviewed || createReview.isSuccess) {
    return (
      <div className="review-success" role="status">
        Bạn đã đánh giá sản phẩm này. Cảm ơn phản hồi của bạn!
      </div>
    )
  }

  async function submit(values: ReviewFormValues) {
    createReview.reset()
    await createReview.mutateAsync(values).catch(() => undefined)
  }

  return (
    <form
      className="review-form"
      onSubmit={handleSubmit(submit)}
      noValidate
    >
      <div>
        <h3>Viết đánh giá</h3>
        <p>Chỉ áp dụng cho sản phẩm thuộc đơn đã giao và đã thanh toán.</p>
      </div>

      {createReview.isError && (
        <div className="form-error" role="alert">
          {getApiErrorMessage(
            createReview.error,
            'Không thể gửi đánh giá. Vui lòng thử lại.',
          )}
        </div>
      )}

      <fieldset className="rating-input">
        <legend>Số sao</legend>
        {[1, 2, 3, 4, 5].map((rating) => (
          <label
            className={rating <= selectedRating ? 'active' : ''}
            key={rating}
          >
            <input
              type="radio"
              value={rating}
              {...register('rating')}
            />
            <span aria-hidden="true">★</span>
            <span className="sr-only">{rating} sao</span>
          </label>
        ))}
      </fieldset>
      {errors.rating && (
        <span className="field-error">{errors.rating.message}</span>
      )}

      <label>
        Nội dung đánh giá
        <textarea
          rows={4}
          placeholder="Chia sẻ cảm nhận của bạn về sản phẩm"
          {...register('comment')}
        />
        {errors.comment && (
          <span className="field-error">{errors.comment.message}</span>
        )}
      </label>

      <button
        className="primary-button review-submit"
        type="submit"
        disabled={createReview.isPending}
      >
        {createReview.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
      </button>
    </form>
  )
}
