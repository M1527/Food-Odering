import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'
import { z } from 'zod'

import { useAuth } from '../features/auth/useAuth'
import { getApiErrorMessage } from '../lib/api-error'

const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên.'),
    email: z.email('Email không hợp lệ.'),
    phone: z.string().trim().optional(),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const { isAuthenticated, register: createAccount } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string>()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  })

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function submit(values: RegisterFormValues) {
    setSubmitError(undefined)

    try {
      await createAccount({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone || undefined,
      })
      navigate('/account', { replace: true })
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'Đăng ký thất bại. Vui lòng thử lại.'),
      )
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit(submit)}>
        <div>
          <h1>Đăng ký</h1>
          <p>Tạo tài khoản để bắt đầu đặt món.</p>
        </div>

        {submitError && (
          <div className="form-error" role="alert">
            {submitError}
          </div>
        )}

        <label>
          Họ và tên
          <input autoComplete="name" {...register('fullName')} />
          {errors.fullName && (
            <span className="field-error">{errors.fullName.message}</span>
          )}
        </label>

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
          Số điện thoại
          <input type="tel" autoComplete="tel" {...register('phone')} />
          {errors.phone && (
            <span className="field-error">{errors.phone.message}</span>
          )}
        </label>

        <label>
          Mật khẩu
          <input
            type="password"
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password && (
            <span className="field-error">{errors.password.message}</span>
          )}
        </label>

        <label>
          Xác nhận mật khẩu
          <input
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <span className="field-error">
              {errors.confirmPassword.message}
            </span>
          )}
        </label>

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </button>

        <p className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </section>
  )
}
