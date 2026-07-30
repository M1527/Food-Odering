import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  cancelOrder,
  getAdminOrders,
  getMyOrders,
  updateAdminOrderStatus,
} from './api'
import type { OrdersQuery } from './types'

export const myOrdersKey = (query?: OrdersQuery) =>
  ['orders', 'my', query] as const

export function useMyOrders(query: OrdersQuery) {
  return useQuery({
    queryKey: myOrdersKey(query),
    queryFn: () => getMyOrders(query),
    placeholderData: keepPreviousData,
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['orders', 'my'],
      }),
  })
}

export const adminOrdersKey = (query?: OrdersQuery) =>
  ['orders', 'admin', query] as const

export function useAdminOrders(query: OrdersQuery) {
  return useQuery({
    queryKey: adminOrdersKey(query),
    queryFn: () => getAdminOrders(query),
    placeholderData: keepPreviousData,
  })
}

export function useUpdateAdminOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAdminOrderStatus,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['orders', 'admin'],
      }),
  })
}
