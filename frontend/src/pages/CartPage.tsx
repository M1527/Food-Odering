import { Link } from 'react-router'

import { useAuth } from '../features/auth/useAuth'
import {
  useCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from '../features/cart/queries'
import { getApiErrorMessage } from '../lib/api-error'
import { formatCurrency } from '../lib/format'

export function CartPage() {
  const { user } = useAuth()
  const userId = user?.id ?? 0
  const cartQuery = useCart(user?.id)
  const updateCartItem = useUpdateCartItem(userId)
  const removeCartItem = useRemoveCartItem(userId)
  const mutationError = updateCartItem.error ?? removeCartItem.error

  if (!user) {
    return null
  }

  if (cartQuery.isPending) {
    return <p>Đang tải giỏ hàng...</p>
  }

  if (cartQuery.isError) {
    return (
      <section className="error-state" role="alert">
        <p>Không thể tải giỏ hàng.</p>
        <button type="button" onClick={() => void cartQuery.refetch()}>
          Thử lại
        </button>
      </section>
    )
  }

  const cart = cartQuery.data

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Giỏ hàng</h1>
          <p>Kiểm tra số lượng trước khi tiến hành đặt hàng.</p>
        </div>
      </div>

      {mutationError && (
        <div className="form-error" role="alert">
          {getApiErrorMessage(
            mutationError,
            'Không thể cập nhật giỏ hàng.',
          )}
        </div>
      )}

      {cart.items.length === 0 ? (
        <div className="empty-cart">
          <p>Giỏ hàng của bạn đang trống.</p>
          <Link className="primary-link" to="/products">
            Xem sản phẩm
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <ul className="cart-list">
            {cart.items.map((item) => {
              const isUpdating =
                updateCartItem.isPending &&
                updateCartItem.variables?.productId === item.product.id
              const isRemoving =
                removeCartItem.isPending &&
                removeCartItem.variables === item.product.id

              return (
                <li className="cart-item" key={item.product.id}>
                  <div className="cart-item-info">
                    <Link to={`/products/${item.product.id}`}>
                      {item.product.name}
                    </Link>
                    <span>{formatCurrency(item.product.price)} / sản phẩm</span>
                    <span>Còn {item.product.stock} trong kho</span>
                  </div>

                  <div className="quantity-control">
                    <button
                      type="button"
                      aria-label={`Giảm số lượng ${item.product.name}`}
                      disabled={
                        item.quantity === 1 || isUpdating || isRemoving
                      }
                      onClick={() =>
                        updateCartItem.mutate({
                          productId: item.product.id,
                          quantity: item.quantity - 1,
                        })
                      }
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Tăng số lượng ${item.product.name}`}
                      disabled={
                        item.quantity >= item.product.stock ||
                        isUpdating ||
                        isRemoving
                      }
                      onClick={() =>
                        updateCartItem.mutate({
                          productId: item.product.id,
                          quantity: item.quantity + 1,
                        })
                      }
                    >
                      +
                    </button>
                  </div>

                  <strong>{formatCurrency(item.subtotal)}</strong>

                  <button
                    className="text-danger-button"
                    type="button"
                    disabled={isUpdating || isRemoving}
                    onClick={() => removeCartItem.mutate(item.product.id)}
                  >
                    {isRemoving ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </li>
              )
            })}
          </ul>

          <aside className="cart-summary">
            <h2>Tổng đơn hàng</h2>
            <div>
              <span>Tạm tính</span>
              <strong>{formatCurrency(cart.total)}</strong>
            </div>
            <p>Phí giao hàng sẽ được xác định ở bước đặt hàng.</p>
          </aside>
        </div>
      )}
    </section>
  )
}
