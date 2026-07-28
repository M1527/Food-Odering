import { NavLink, Outlet } from 'react-router'

import { useAuth } from '../features/auth/useAuth'

export function CustomerLayout() {
  const { user } = useAuth()

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
              <NavLink to="/account">{user.fullName}</NavLink>
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
