export type PaymentMethod = 'COD' | 'BANK'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export type Payment = {
  id: number
  orderId: number
  method: PaymentMethod
  status: PaymentStatus
  amount: string
  paidAt?: string
  createdAt: string
}

export type CreatePaymentInput = {
  method: PaymentMethod
}

export type CreatePaymentResponse = {
  message: string
  payment: Payment
}
