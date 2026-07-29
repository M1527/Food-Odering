import { useState } from 'react'
import { Link } from 'react-router'

import {
  orderStatusLabels,
  paymentStatusLabels,
} from '../features/orders/display'
import {
  useCancelOrder,
  useMyOrders,
} from '../features/orders/queries'
import type { Order, OrderStatus } from '../features/orders/types'
import { getApiErrorMessage } from '../lib/api-error'
import { formatCurrency, formatDate } from '../lib/format'

const ORDERS_PER_PAGE = 5
const ORDER_STATUSES = Object.keys(orderStatusLabels) as OrderStatus[]

export function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus>()
  const [page, setPage] = useState(1)
  const ordersQuery = useMyOrders({
    status,
    page,
    limit: ORDERS_PER_PAGE,
  })
  const cancelOrder = useCancelOrder()
  const totalPages = ordersQuery.data
    ? Math.max(1, Math.ceil(ordersQuery.data.total / ordersQuery.data.limit))
    : 1

  function selectStatus(nextStatus?: OrderStatus) {
    setStatus(nextStatus)
    setPage(1)
    cancelOrder.reset()
  }

  function handleCancel(order: Order) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn hủy đơn ${order.orderCode}? Tồn kho sẽ được hoàn lại.`,
    )

    if (!confirmed) {
      return
    }

    cancelOrder.reset()
    cancelOrder.mutate(order.id, {
      onSuccess: () => {
        if (
          status === 'PENDING' &&
          ordersQuery.data?.orders.length === 1 &&
          page > 1
        ) {
          setPage((currentPage) => currentPage - 1)
        }
      },
    })
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Đơn hàng của tôi</h1>
          <p>Theo dõi trạng thái và xem lại các sản phẩm đã đặt.</p>
        </div>
      </div>

      <div className="order-filters" aria-label="Lọc đơn hàng theo trạng thái">
        <button
          className={status === undefined ? 'active' : ''}
          type="button"
          onClick={() => selectStatus()}
        >
          Tất cả
        </button>
        {ORDER_STATUSES.map((orderStatus) => (
          <button
            className={status === orderStatus ? 'active' : ''}
            key={orderStatus}
            type="button"
            onClick={() => selectStatus(orderStatus)}
          >
            {orderStatusLabels[orderStatus]}
          </button>
        ))}
      </div>

      {cancelOrder.isError && (
        <div className="form-error order-action-error" role="alert">
          {getApiErrorMessage(
            cancelOrder.error,
            'Không thể hủy đơn hàng. Vui lòng tải lại và thử lại.',
          )}
        </div>
      )}

      {ordersQuery.isPending && <p>Đang tải đơn hàng...</p>}

      {ordersQuery.isError && (
        <section className="error-state" role="alert">
          <p>Không thể tải lịch sử đơn hàng.</p>
          <button type="button" onClick={() => void ordersQuery.refetch()}>
            Thử lại
          </button>
        </section>
      )}

      {ordersQuery.data && ordersQuery.data.orders.length === 0 && (
        <div className="empty-cart">
          <p>Không có đơn hàng phù hợp với trạng thái này.</p>
          <Link className="primary-link" to="/products">
            Xem sản phẩm
          </Link>
        </div>
      )}

      {ordersQuery.data && ordersQuery.data.orders.length > 0 && (
        <>
          <div
            className={`order-list ${
              ordersQuery.isFetching ? 'is-fetching' : ''
            }`}
          >
            {ordersQuery.data.orders.map((order) => {
              const canCancel =
                order.status === 'PENDING' &&
                order.payment?.status !== 'PAID'
              const isCanceling =
                cancelOrder.isPending && cancelOrder.variables === order.id

              return (
                <article className="order-card" key={order.id}>
                  <div className="order-card-heading">
                    <div>
                      <h2>{order.orderCode}</h2>
                      <time dateTime={order.createdAt}>
                        Đặt ngày {formatDate(order.createdAt)}
                      </time>
                    </div>
                    <span
                      className={`order-status status-${order.status.toLowerCase()}`}
                    >
                      {orderStatusLabels[order.status]}
                    </span>
                  </div>

                  <div className="order-card-summary">
                    <span>
                      {order.items.reduce(
                        (total, item) => total + item.quantity,
                        0,
                      )}{' '}
                      sản phẩm
                    </span>
                    <strong>{formatCurrency(order.totalAmount)}</strong>
                  </div>

                  <details className="order-details">
                    <summary>Xem chi tiết đơn hàng</summary>
                    <ul>
                      {order.items.map((item) => (
                        <li key={item.id}>
                          <span>
                            {item.productName} × {item.quantity}
                          </span>
                          <strong>{formatCurrency(item.subtotal)}</strong>
                        </li>
                      ))}
                    </ul>

                    <dl>
                      <div>
                        <dt>Địa chỉ</dt>
                        <dd>{order.shippingAddress}</dd>
                      </div>
                      {order.note && (
                        <div>
                          <dt>Ghi chú</dt>
                          <dd>{order.note}</dd>
                        </div>
                      )}
                      <div>
                        <dt>Thanh toán</dt>
                        <dd>
                          {order.payment
                            ? `${
                                order.payment.method === 'COD'
                                  ? 'Khi nhận hàng'
                                  : 'Chuyển khoản'
                              } · ${
                                paymentStatusLabels[order.payment.status]
                              }`
                            : 'Chưa ghi nhận'}
                        </dd>
                      </div>
                    </dl>
                  </details>

                  {canCancel && (
                    <div className="order-actions">
                      <button
                        className="text-danger-button"
                        type="button"
                        disabled={cancelOrder.isPending}
                        onClick={() => handleCancel(order)}
                      >
                        {isCanceling ? 'Đang hủy...' : 'Hủy đơn hàng'}
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Phân trang đơn hàng">
              <button
                type="button"
                disabled={page === 1 || ordersQuery.isFetching}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              >
                Trang trước
              </button>
              <span>
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page === totalPages || ordersQuery.isFetching}
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
