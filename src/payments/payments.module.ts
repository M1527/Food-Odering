import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersModule } from '../orders/orders.module';
import { Payment } from './entities/payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), forwardRef(() => OrdersModule)],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}