import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MailModule } from '../mail/mail.module';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../payments/entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { DailyReportsService } from './daily-reports.service';
import { DailyReport } from './entities/daily-report.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyReport, Order, OrderItem, Payment, User]),
    MailModule,
  ],
  providers: [DailyReportsService],
  exports: [DailyReportsService],
})
export class DailyReportsModule {}
