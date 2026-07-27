import { NavLink, Outlet } from 'react-router'

export function CustomerLayout() {
  return (
    <div>
      <header>
        <nav>
          <NavLink to="/">Trang chủ</NavLink>
          <NavLink to="/products">Sản phẩm</NavLink>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}
