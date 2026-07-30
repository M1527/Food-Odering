import { http } from '../../lib/http'
import type {
  CancelOrderResponse,
  CreateOrderInput,
  CreateOrderResponse,
  OrdersQuery,
  OrdersResponse,
  UpdateOrderStatusInput,
  UpdateOrderStatusResponse,
} from './types'

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResponse> {
  const response = await http.post<CreateOrderResponse>('/orders', input)

  return response.data
}

export async function getMyOrders(
  query: OrdersQuery,
): Promise<OrdersResponse> {
  const response = await http.get<OrdersResponse>('/orders/my', {
    params: query,
  })

  return response.data
}

export async function cancelOrder(
  orderId: number,
): Promise<CancelOrderResponse> {
  const response = await http.patch<CancelOrderResponse>(
    `/orders/${orderId}/cancel`,
  )

  return response.data
}

export async function getAdminOrders(
  query: OrdersQuery,
): Promise<OrdersResponse> {
  const response = await http.get<OrdersResponse>('/admin/orders', {
    params: query,
  })

  return response.data
}

export async function updateAdminOrderStatus({
  orderId,
  status,
}: UpdateOrderStatusInput): Promise<UpdateOrderStatusResponse> {
  const response = await http.patch<UpdateOrderStatusResponse>(
    `/admin/orders/${orderId}/status`,
    {
      status,
    },
  )

  return response.data
}
