import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { setTimeout as delay } from 'node:timers/promises';

import {
  ORDER_STATUS_CHANGED_EVENT,
  OrderStatusChangedEvent,
} from '../events/order-status-changed.event';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class OrderStatusChangedListener {
  private readonly processingByOrder = new Map<number, Promise<void>>();
  private readonly maxAttempts = 3;
  private readonly retryDelayMs = 100;

  private readonly logger = new Logger(OrderStatusChangedListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(ORDER_STATUS_CHANGED_EVENT, {
    async: true,
  })
  async handle(event: OrderStatusChangedEvent): Promise<void> {
    const previous = this.processingByOrder.get(event.orderId);
    const current = (previous ?? Promise.resolve())
      .catch(() => undefined)
      .then(() => this.createWithRetry(event));

    this.processingByOrder.set(event.orderId, current);

    try {
      await current;
    } finally {
      if (this.processingByOrder.get(event.orderId) === current) {
        this.processingByOrder.delete(event.orderId);
      }
    }
  }

  private async createWithRetry(event: OrderStatusChangedEvent): Promise<void> {
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        await this.notificationsService.createOrderStatusNotification(event);
        return;
      } catch (error) {
        if (attempt === this.maxAttempts) {
          this.logger.error(
            `Failed to create notification for order ${event.orderId} after ${this.maxAttempts} attempts`,
            error instanceof Error ? error.stack : String(error),
          );
          throw error;
        }

        this.logger.warn(
          `Retrying notification for order ${event.orderId} (${attempt}/${this.maxAttempts})`,
        );
        await delay(this.retryDelayMs * attempt);
      }
    }
  }
}
