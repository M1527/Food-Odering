import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';

import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/entities/order.entity';
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
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,

    private readonly ordersService: OrdersService,
    private readonly i18n: I18nService,
  ) {}

  async create(orderId: number, createPaymentDto: CreatePaymentDto) {
    const order = await this.ordersService.getOrderOrThrow(orderId);

    if (order.status === OrderStatus.Canceled) {
      throw new BadRequestException(
        this.translate('payments.errors.orderCanceled'),
      );
    }

    const existingPayment = await this.paymentsRepository.findOne({
      where: {
        orderId,
      },
    });

    if (existingPayment) {
      throw new BadRequestException(
        this.translate('payments.errors.alreadyPaid'),
      );
    }

    const status =
      createPaymentDto.method === PaymentMethod.Cod
        ? PaymentStatus.Pending
        : PaymentStatus.Paid;

    const payment = this.paymentsRepository.create({
      orderId: order.id,
      order,
      method: createPaymentDto.method,
      status,
      amount: order.totalAmount,
      paidAt: status === PaymentStatus.Paid ? new Date() : undefined,
    });

    try {
      const savedPayment = await this.paymentsRepository.save(payment);

      return {
        message: this.translate('payments.messages.created'),
        payment: PaymentResponseDto.createFromPayment(savedPayment),
      };
    } catch (error) {
      throw error;
    }
  }

  private translate(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang });
  }
}