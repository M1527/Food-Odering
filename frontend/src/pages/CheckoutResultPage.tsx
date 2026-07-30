import { Link, useLocation } from 'react-router'

import type { CheckoutResultState } from '../features/checkout/types'
import { formatCurrency } from '../lib/format'

export function CheckoutResultPage() {
  const location = useLocation()
  const result = location.state as CheckoutResultState | null

  if (!result?.order) {
    return (
      <section className="checkout-result">
        <h1>Không còn thông tin lần đặt hàng này</h1>
        <p>
          Trang kết quả không lưu dữ liệu sau khi mở lại. Hãy vào lịch sử đơn
          hàng để kiểm tra đơn vừa tạo.
        </p>
        <Link className="primary-link" to="/orders">
          Xem đơn hàng
        </Link>
      </section>
    )
  }

  const paymentCompleted = Boolean(result.payment)

  return (
    <section className="checkout-result">
      <div
        className={paymentCompleted ? 'result-success' : 'result-warning'}
        role="status"
      >
        <span aria-hidden="true">{paymentCompleted ? '✓' : '!'}</span>
        <div>
          <h1>Đơn hàng đã được tạo</h1>
          <p>
            Mã đơn hàng: <strong>{result.order.orderCode}</strong>
          </p>
        </div>
      </div>

      {!paymentCompleted && (
        <div className="payment-warning" role="alert">
          <strong>Chưa ghi nhận được phương thức thanh toán.</strong>
          <p>{result.paymentError}</p>
          <p>
            Không đặt lại đơn vì đơn <strong>{result.order.orderCode}</strong>{' '}
            đã được tạo. Hãy lưu mã đơn để kiểm tra hoặc xử lý sau.
          </p>
        </div>
      )}

      <dl className="result-details">
        <div>
          <dt>Tổng tiền</dt>
          <dd>{formatCurrency(result.order.totalAmount)}</dd>
        </div>
        <div>
          <dt>Giao đến</dt>
          <dd>{result.order.shippingAddress}</dd>
        </div>
        <div>
          <dt>Thanh toán</dt>
          <dd>
            {result.paymentMethod === 'COD'
              ? 'Thanh toán khi nhận hàng'
              : 'Chuyển khoản'}
          </dd>
        </div>
        <div>
          <dt>Trạng thái thanh toán</dt>
          <dd>
            {result.payment
              ? result.payment.status === 'PAID'
                ? 'Đã thanh toán'
                : 'Chờ thanh toán'
              : 'Chưa ghi nhận'}
          </dd>
        </div>
      </dl>

      <div className="result-actions">
        <Link className="primary-link" to="/orders">
          Xem đơn hàng
        </Link>
        <Link to="/products">Tiếp tục mua hàng</Link>
      </div>
    </section>
  )
}
