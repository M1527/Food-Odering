import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'

import { useAuth } from '../features/auth/useAuth'
import { getApiErrorMessage } from '../lib/api-error'

const loginSchema = z.object({
  email: z.email('Email không hợp lệ.'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

type LoginLocationState = {
  from?: string
}

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitError, setSubmitError] = useState<string>()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const destination =
    (location.state as LoginLocationState | null)?.from ?? '/account'

  async function submit(values: LoginFormValues) {
    setSubmitError(undefined)

    try {
      await login(values)
      navigate(destination, { replace: true })
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'Đăng nhập thất bại. Vui lòng thử lại.'),
      )
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit(submit)}>
        <div>
          <h1>Đăng nhập</h1>
          <p>Đăng nhập để đặt hàng và quản lý tài khoản.</p>
        </div>

        {submitError && (
          <div className="form-error" role="alert">
            {submitError}
          </div>
        )}

        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && (
            <span className="field-error">{errors.email.message}</span>
          )}
        </label>

        <label>
          Mật khẩu
          <input
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && (
            <span className="field-error">{errors.password.message}</span>
          )}
        </label>

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <p className="auth-switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </form>
    </section>
  )
}
