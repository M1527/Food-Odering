import { ApiProperty } from '@nestjs/swagger';

import {
  Notification,
  NotificationType,
} from '../entities/notification.entity';

export class NotificationResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.OrderStatus,
  })
  type!: NotificationType;

  @ApiProperty({
    example: 'Đơn hàng đã bị hủy',
  })
  title!: string;

  @ApiProperty({
    example: 'Đơn hàng #ORD-123 của bạn đã bị hủy',
  })
  content!: string;

  @ApiProperty({ example: false })
  isRead!: boolean;

  @ApiProperty({
    example: '2026-07-13T09:00:00.000Z',
  })
  createdAt!: Date;

  static createFromNotification(
    notification: Notification,
  ): NotificationResponseDto {
    const dto = new NotificationResponseDto();

    dto.id = notification.id;
    dto.userId = notification.userId;
    dto.type = notification.type;
    dto.title = notification.title;
    dto.content = notification.content;
    dto.isRead = notification.isRead;
    dto.createdAt = notification.createdAt;

    return dto;
  }
}
