import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { cancelOrder, getMyOrders } from './api'
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
