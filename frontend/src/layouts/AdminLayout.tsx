import { NavLink, Outlet } from 'react-router'

export function AdminLayout() {
  return (
    <div>
      <nav className="admin-subnav" aria-label="Điều hướng quản trị">
        <NavLink to="/admin/orders">Đơn hàng</NavLink>
        <NavLink to="/admin/products">Sản phẩm</NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
