import type { OrderStatus } from './types'
import type { PaymentStatus } from '../payments/types'

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DONE: 'Hoàn thành',
  CANCELED: 'Đã hủy',
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
}
