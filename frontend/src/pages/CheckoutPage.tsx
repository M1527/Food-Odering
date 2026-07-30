import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'

import { useAuth } from '../features/auth/useAuth'
import { cartKey, useCart } from '../features/cart/queries'
import type { Cart } from '../features/cart/types'
import type { CheckoutResultState } from '../features/checkout/types'
import { createOrder } from '../features/orders/api'
import { createPayment } from '../features/payments/api'
import { getApiErrorMessage } from '../lib/api-error'
import { formatCurrency } from '../lib/format'

const checkoutSchema = z.object({
  shippingAddress: z
    .string()
    .trim()
    .min(5, 'Vui lòng nhập địa chỉ giao hàng đầy đủ.'),
  note: z.string().trim().optional(),
  paymentMethod: z.enum(['COD', 'BANK']),
})

type CheckoutFormValues = z.infer<typeof checkoutSchema>

export function CheckoutPage() {
  const { user } = useAuth()
  const userId = user?.id ?? 0
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const cartQuery = useCart(user?.id)
  const [submitError, setSubmitError] = useState<string>()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: '',
      note: '',
      paymentMethod: 'COD',
    },
  })

  if (!user) {
    return null
  }

  if (cartQuery.isPending) {
    return <p>Đang tải thông tin thanh toán...</p>
  }

  if (cartQuery.isError) {
    return (
      <section className="error-state" role="alert">
        <p>Không thể tải giỏ hàng để thanh toán.</p>
        <button type="button" onClick={() => void cartQuery.refetch()}>
          Thử lại
        </button>
      </section>
    )
  }

  const cart = cartQuery.data

  if (cart.items.length === 0) {
    return (
      <section className="empty-cart">
        <h1>Chưa có sản phẩm để đặt hàng</h1>
        <p>Hãy thêm ít nhất một sản phẩm vào giỏ hàng trước.</p>
        <Link className="primary-link" to="/products">
          Xem sản phẩm
        </Link>
      </section>
    )
  }

  async function submit(values: CheckoutFormValues) {
    setSubmitError(undefined)

    try {
      const orderResponse = await createOrder({
        shippingAddress: values.shippingAddress,
        note: values.note || undefined,
      })

      queryClient.setQueryData<Cart>(cartKey(userId), {
        items: [],
        total: '0.00',
      })

      const result: CheckoutResultState = {
        order: orderResponse.order,
        paymentMethod: values.paymentMethod,
      }

      try {
        const paymentResponse = await createPayment(orderResponse.order.id, {
          method: values.paymentMethod,
        })
        result.payment = paymentResponse.payment
      } catch (error) {
        result.paymentError = getApiErrorMessage(
          error,
          'Không thể ghi nhận phương thức thanh toán.',
        )
      }

      navigate('/checkout/result', {
        replace: true,
        state: result,
      })
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'Không thể tạo đơn hàng. Vui lòng thử lại.'),
      )
    }
  }

  return (
    <section>
      <Link className="back-link" to="/cart">
        ← Quay lại giỏ hàng
      </Link>

      <div className="page-heading">
        <div>
          <h1>Đặt hàng</h1>
          <p>Nhập thông tin giao hàng và chọn cách thanh toán.</p>
        </div>
      </div>

      <div className="checkout-layout">
        <form
          className="checkout-form"
          onSubmit={handleSubmit(submit)}
          noValidate
        >
          {submitError && (
            <div className="form-error" role="alert">
              {submitError}
            </div>
          )}

          <label>
            Địa chỉ giao hàng
            <textarea
              rows={3}
              autoComplete="street-address"
              {...register('shippingAddress')}
            />
            {errors.shippingAddress && (
              <span className="field-error">
                {errors.shippingAddress.message}
              </span>
            )}
          </label>

          <label>
            Ghi chú (không bắt buộc)
            <textarea
              rows={3}
              placeholder="Ví dụ: gọi trước khi giao"
              {...register('note')}
            />
          </label>

          <fieldset className="payment-options">
            <legend>Phương thức thanh toán</legend>

            <label>
              <input type="radio" value="COD" {...register('paymentMethod')} />
              <span>
                <strong>Thanh toán khi nhận hàng</strong>
                <small>Thanh toán trực tiếp khi đơn hàng được giao.</small>
              </span>
            </label>

            <label>
              <input type="radio" value="BANK" {...register('paymentMethod')} />
              <span>
                <strong>Chuyển khoản (mô phỏng)</strong>
                <small>
                  Backend hiện ghi nhận đã thanh toán ngay, chưa kết nối cổng
                  thanh toán hoặc mã QR.
                </small>
              </span>
            </label>
          </fieldset>

          <button
            className="primary-button checkout-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang tạo đơn hàng...' : 'Xác nhận đặt hàng'}
          </button>
        </form>

        <aside className="cart-summary checkout-summary">
          <h2>Đơn hàng của bạn</h2>
          <ul>
            {cart.items.map((item) => (
              <li key={item.product.id}>
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <strong>{formatCurrency(item.subtotal)}</strong>
              </li>
            ))}
          </ul>
          <div>
            <span>Tổng cộng</span>
            <strong>{formatCurrency(cart.total)}</strong>
          </div>
        </aside>
      </div>
    </section>
  )
}
