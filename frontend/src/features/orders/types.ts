import type { Payment } from '../payments/types'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SHIPPING'
  | 'DONE'
  | 'CANCELED'

export type OrderItem = {
  id: number
  productId: number
  productName: string
  unitPrice: string
  quantity: number
  subtotal: string
}

export type Order = {
  id: number
  orderCode: string
  status: OrderStatus
  totalAmount: string
  shippingAddress: string
  note?: string
  items: OrderItem[]
  payment?: Payment
  createdAt: string
  updatedAt: string
}

export type CreateOrderInput = {
  shippingAddress: string
  note?: string
}

export type CreateOrderResponse = {
  message: string
  order: Order
}

export type OrdersQuery = {
  status?: OrderStatus
  page?: number
  limit?: number
}

export type OrdersResponse = {
  orders: Order[]
  total: number
  page: number
  limit: number
}

export type CancelOrderResponse = {
  message: string
  order: Order
}
