import { NavLink, Outlet } from 'react-router'

import { useAuth } from '../features/auth/useAuth'
import { useCart } from '../features/cart/queries'

export function CustomerLayout() {
  const { user } = useAuth()
  const cartQuery = useCart(user?.id)
  const cartCount =
    cartQuery.data?.items.reduce(
      (total, item) => total + item.quantity,
      0,
    ) ?? 0

  return (
    <div>
      <header>
        <nav>
          <div className="nav-primary">
            <NavLink to="/">Trang chủ</NavLink>
            <NavLink to="/products">Sản phẩm</NavLink>
          </div>

          <div className="nav-auth">
            {user ? (
              <>
                <NavLink to="/cart">
                  Giỏ hàng
                  {cartCount > 0 && (
                    <span className="cart-badge">{cartCount}</span>
                  )}
                </NavLink>
                <NavLink to="/orders">Đơn hàng</NavLink>
                {user.role === 'ADMIN' && (
                  <NavLink to="/admin/orders">Quản trị</NavLink>
                )}
                <NavLink to="/account">{user.fullName}</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/login">Đăng nhập</NavLink>
                <NavLink to="/register">Đăng ký</NavLink>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}
