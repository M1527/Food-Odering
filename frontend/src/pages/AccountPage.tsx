import { useState } from 'react'
import { useNavigate } from 'react-router'

import { useAuth } from '../features/auth/useAuth'

export function AccountPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (!user) {
    return null
  }

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Tài khoản của tôi</h1>
          <p>Thông tin được trả về từ phiên đăng nhập hiện tại.</p>
        </div>
      </div>

      <dl className="account-card">
        <div>
          <dt>Họ tên</dt>
          <dd>{user.fullName}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt>Số điện thoại</dt>
          <dd>{user.phone || 'Chưa cập nhật'}</dd>
        </div>
        <div>
          <dt>Vai trò</dt>
          <dd>{user.role}</dd>
        </div>
      </dl>

      <button
        className="danger-button"
        type="button"
        disabled={isLoggingOut}
        onClick={() => void handleLogout()}
      >
        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
      </button>
    </section>
  )
}
