import { OrderStatus } from '../../orders/entities/order.entity';

export const ORDER_STATUS_CHANGED_EVENT = 'order.status.changed';

export class OrderStatusChangedEvent {
  constructor(
    public readonly userId: number,
    public readonly orderId: number,
    public readonly orderCode: string,
    public readonly status: OrderStatus,
  ) {}
}
