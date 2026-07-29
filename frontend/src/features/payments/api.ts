import { http } from '../../lib/http'
import type {
  CreatePaymentInput,
  CreatePaymentResponse,
} from './types'

export async function createPayment(
  orderId: number,
  input: CreatePaymentInput,
): Promise<CreatePaymentResponse> {
  const response = await http.post<CreatePaymentResponse>(
    `/payments/${orderId}`,
    input,
  )

  return response.data
}
