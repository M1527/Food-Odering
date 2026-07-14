import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DataSource } from 'typeorm';

import { translate } from '../common/utils/i18n.util';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  async create(
    userId: number,
    orderId: number,
    createPaymentDto: CreatePaymentDto,
  ) {
    const savedPayment = await this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(Order);
      const paymentRepository = manager.getRepository(Payment);

      const order = await orderRepository.findOne({
        where: {
          id: orderId,
        },
        relations: {
          payment: true,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!order) {
        throw new NotFoundException(
          translate(this.i18n, 'orders.errors.notFound'),
        );
      }

      if (order.userId !== userId) {
        throw new ForbiddenException(
          translate(this.i18n, 'payments.errors.forbidden'),
        );
      }

      if (order.status === OrderStatus.Canceled) {
        throw new BadRequestException(
          translate(this.i18n, 'payments.errors.orderCanceled'),
        );
      }

      if (order.payment) {
        throw new BadRequestException(
          translate(this.i18n, 'payments.errors.alreadyPaid'),
        );
      }

      const status =
        createPaymentDto.method === PaymentMethod.Cod
          ? PaymentStatus.Pending
          : PaymentStatus.Paid;

      const payment = paymentRepository.create({
        orderId: order.id,
        order,
        method: createPaymentDto.method,
        status,
        amount: order.totalAmount,
        paidAt: status === PaymentStatus.Paid ? new Date() : undefined,
      });

      return paymentRepository.save(payment);
    });

    return {
      message: translate(this.i18n, 'payments.messages.created'),
      payment: PaymentResponseDto.createFromPayment(savedPayment),
    };
  }
}
