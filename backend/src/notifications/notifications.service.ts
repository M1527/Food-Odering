import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';

import { NotificationResponseDto } from './dto/notification-response.dto';
import { Notification, NotificationType } from './entities/notification.entity';
import { OrderStatusChangedEvent } from './events/order-status-changed.event';

@Injectable()
export class NotificationsService {
  private readonly notificationLanguage = 'vi';

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,

    private readonly i18n: I18nService,
  ) {}

  async createOrderStatusNotification(event: OrderStatusChangedEvent) {
    const translationKey = `notifications.orderStatus.${event.status}`;

    const notification = this.notificationsRepository.create({
      userId: event.userId,
      type: NotificationType.OrderStatus,
      title: this.translate(`${translationKey}.title`),
      content: this.translate(`${translationKey}.content`, {
        orderCode: event.orderCode,
      }),
      isRead: false,
    });

    const savedNotification =
      await this.notificationsRepository.save(notification);

    return {
      message: this.translate('notifications.messages.sent'),
      notification:
        NotificationResponseDto.createFromNotification(savedNotification),
    };
  }

  private translate(key: string, args?: Record<string, unknown>): string {
    return this.i18n.t(key, {
      lang: this.notificationLanguage,
      args,
    });
  }
}
