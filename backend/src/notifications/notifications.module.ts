import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Notification } from './entities/notification.entity';
import { OrderStatusChangedListener } from './listeners/order-status-changed.listener';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  providers: [NotificationsService, OrderStatusChangedListener],
  exports: [NotificationsService],
})
export class NotificationsModule {}
