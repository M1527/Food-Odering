import { useState } from 'react'

import {
  orderStatusLabels,
  paymentStatusLabels,
} from '../../features/orders/display'
import {
  useAdminOrders,
  useUpdateAdminOrderStatus,
} from '../../features/orders/queries'
import type {
  Order,
  OrderStatus,
} from '../../features/orders/types'
import { getApiErrorMessage } from '../../lib/api-error'
import { formatCurrency, formatDate } from '../../lib/format'

const ORDERS_PER_PAGE = 10
const ORDER_STATUSES = Object.keys(orderStatusLabels) as OrderStatus[]
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'SHIPPING',
  SHIPPING: 'DONE',
}

const nextStatusActionLabels: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: 'Xác nhận đơn',
  SHIPPING: 'Bắt đầu giao hàng',
  DONE: 'Hoàn thành đơn',
}

export function AdminOrdersPage() {
  const [status, setStatus] = useState<OrderStatus>()
  const [page, setPage] = useState(1)
  const ordersQuery = useAdminOrders({
    status,
    page,
    limit: ORDERS_PER_PAGE,
  })
  const updateStatus = useUpdateAdminOrderStatus()
  const totalPages = ordersQuery.data
    ? Math.max(1, Math.ceil(ordersQuery.data.total / ordersQuery.data.limit))
    : 1

  function selectStatus(nextStatus?: OrderStatus) {
    setStatus(nextStatus)
    setPage(1)
    updateStatus.reset()
  }

  function handleUpdateStatus(order: Order, nextStatus: OrderStatus) {
    const confirmed = window.confirm(
      `Chuyển đơn ${order.orderCode} sang trạng thái “${orderStatusLabels[nextStatus]}”?`,
    )

    if (!confirmed) {
      return
    }

    updateStatus.reset()
    updateStatus.mutate(
      {
        orderId: order.id,
        status: nextStatus,
      },
      {
        onSuccess: () => {
          if (
            status === order.status &&
            ordersQuery.data?.orders.length === 1 &&
            page > 1
          ) {
            setPage((currentPage) => currentPage - 1)
          }
        },
      },
    )
  }

  return (
    <section className="admin-page">
      <div className="page-heading">
        <div>
          <p className="admin-eyebrow">Quản trị</p>
          <h1>Quản lý đơn hàng</h1>
          <p>Xác nhận, giao hàng và hoàn tất đơn theo đúng quy trình.</p>
        </div>
        {ordersQuery.data && (
          <span className="admin-total">{ordersQuery.data.total} đơn hàng</span>
        )}
      </div>

      <div className="order-filters" aria-label="Lọc đơn hàng quản trị">
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

      {updateStatus.isError && (
        <div className="form-error order-action-error" role="alert">
          {getApiErrorMessage(
            updateStatus.error,
            'Không thể cập nhật trạng thái đơn hàng.',
          )}
        </div>
      )}

      {ordersQuery.isPending && <p>Đang tải danh sách đơn hàng...</p>}

      {ordersQuery.isError && (
        <section className="error-state" role="alert">
          <p>Không thể tải danh sách đơn hàng quản trị.</p>
          <button type="button" onClick={() => void ordersQuery.refetch()}>
            Thử lại
          </button>
        </section>
      )}

      {ordersQuery.data && ordersQuery.data.orders.length === 0 && (
        <div className="empty-cart">
          <p>Không có đơn hàng phù hợp với trạng thái này.</p>
        </div>
      )}

      {ordersQuery.data && ordersQuery.data.orders.length > 0 && (
        <>
          <div
            className={`admin-order-list ${
              ordersQuery.isFetching ? 'is-fetching' : ''
            }`}
          >
            {ordersQuery.data.orders.map((order) => {
              const nextStatus = NEXT_STATUS[order.status]
              const paymentAllowsProgress =
                Boolean(order.payment) &&
                order.payment?.status !== 'FAILED' &&
                order.payment?.status !== 'REFUNDED' &&
                !(
                  order.payment?.method === 'BANK' &&
                  order.payment.status !== 'PAID'
                )
              const isUpdating =
                updateStatus.isPending &&
                updateStatus.variables?.orderId === order.id

              return (
                <article className="admin-order-card" key={order.id}>
                  <div className="admin-order-main">
                    <div className="admin-order-identity">
                      <div>
                        <h2>{order.orderCode}</h2>
                        <time dateTime={order.createdAt}>
                          {formatDate(order.createdAt)}
                        </time>
                      </div>
                      <span
                        className={`order-status status-${order.status.toLowerCase()}`}
                      >
                        {orderStatusLabels[order.status]}
                      </span>
                    </div>

                    <dl className="admin-order-facts">
                      <div>
                        <dt>Khách hàng</dt>
                        <dd>{order.user?.fullName ?? 'Không xác định'}</dd>
                      </div>
                      <div>
                        <dt>Liên hệ</dt>
                        <dd>
                          {order.user?.phone || order.user?.email || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt>Tổng tiền</dt>
                        <dd>{formatCurrency(order.totalAmount)}</dd>
                      </div>
                      <div>
                        <dt>Thanh toán</dt>
                        <dd>
                          {order.payment
                            ? `${
                                order.payment.method === 'COD'
                                  ? 'COD'
                                  : 'Chuyển khoản'
                              } · ${
                                paymentStatusLabels[order.payment.status]
                              }`
                            : 'Chưa ghi nhận'}
                        </dd>
                      </div>
                    </dl>

                    <details className="admin-order-details">
                      <summary>
                        Chi tiết sản phẩm và địa chỉ giao hàng
                      </summary>
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
                      <p>
                        <strong>Giao đến:</strong> {order.shippingAddress}
                      </p>
                      {order.note && (
                        <p>
                          <strong>Ghi chú:</strong> {order.note}
                        </p>
                      )}
                    </details>
                  </div>

                  <aside className="admin-order-action">
                    {nextStatus ? (
                      <>
                        <span>Bước tiếp theo</span>
                        <strong>{orderStatusLabels[nextStatus]}</strong>
                        <button
                          className="primary-button"
                          type="button"
                          disabled={
                            updateStatus.isPending || !paymentAllowsProgress
                          }
                          onClick={() =>
                            handleUpdateStatus(order, nextStatus)
                          }
                        >
                          {isUpdating
                            ? 'Đang cập nhật...'
                            : nextStatusActionLabels[nextStatus]}
                        </button>
                        {!paymentAllowsProgress && (
                          <small>
                            Đơn cần có thanh toán hợp lệ trước khi xử lý.
                          </small>
                        )}
                      </>
                    ) : (
                      <span>
                        {order.status === 'DONE'
                          ? 'Đơn đã hoàn tất'
                          : 'Đơn đã bị hủy'}
                      </span>
                    )}
                  </aside>
                </article>
              )
            })}
          </div>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Phân trang đơn quản trị">
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
