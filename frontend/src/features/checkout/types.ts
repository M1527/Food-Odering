import type { Order } from '../orders/types'
import type { Payment, PaymentMethod } from '../payments/types'

export type CheckoutResultState = {
  order: Order
  paymentMethod: PaymentMethod
  payment?: Payment
  paymentError?: string
}
