import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { I18nService } from 'nestjs-i18n';
import { DataSource, Repository } from 'typeorm';

import { CartService } from '../cart/cart.service';
import { translate } from '../common/utils/i18n.util';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../payments/entities/payment.entity';
import { Product, ProductStatus } from '../products/entities/product.entity';
import { RedisService } from '../redis/redis.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly checkoutLockTtlSeconds = 60;

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,

    private readonly cartService: CartService,
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  async create(userId: number, createOrderDto: CreateOrderDto) {
    const checkoutLockKey = this.getCheckoutLockKey(userId);
    const checkoutLockToken = randomUUID();
    const checkoutLockAcquired = await this.redisService.setIfNotExists(
      checkoutLockKey,
      checkoutLockToken,
      this.checkoutLockTtlSeconds,
    );

    if (!checkoutLockAcquired) {
      throw new BadRequestException(
        translate(this.i18n, 'orders.errors.checkoutInProgress'),
      );
    }

    try {
      const cart = await this.cartService.getCart(userId);

      if (!cart.items.length) {
        throw new BadRequestException(
          translate(this.i18n, 'orders.errors.cartEmpty'),
        );
      }

      const order = await this.dataSource.transaction(async (manager) => {
        const orderRepository = manager.getRepository(Order);
        const orderItemRepository = manager.getRepository(OrderItem);
        const productRepository = manager.getRepository(Product);

        const orderedCartItems = [...cart.items].sort(
          (firstItem, secondItem) =>
            firstItem.product.id - secondItem.product.id,
        );
        const orderItems: OrderItem[] = [];
        let total = 0;

        for (const cartItem of orderedCartItems) {
          const product = await productRepository.findOne({
            where: {
              id: cartItem.product.id,
            },
            lock: {
              mode: 'pessimistic_write',
            },
          });

          if (!product) {
            throw new NotFoundException(
              translate(this.i18n, 'products.errors.notFound'),
            );
          }

          if (product.status !== ProductStatus.Active) {
            throw new BadRequestException(
              translate(this.i18n, 'orders.errors.productInactive'),
            );
          }

          if (product.stock < cartItem.quantity) {
            throw new BadRequestException(
              translate(this.i18n, 'orders.errors.exceedStock'),
            );
          }

          const subtotal = Number(product.price) * cartItem.quantity;

          total += subtotal;
          product.stock -= cartItem.quantity;

          await productRepository.save(product);

          const orderItem = orderItemRepository.create({
            productId: product.id,
            productName: product.name,
            unitPrice: product.price,
            quantity: cartItem.quantity,
            subtotal: subtotal.toFixed(2),
          });

          orderItems.push(orderItem);
        }

        const createdOrder = orderRepository.create({
          userId,
          orderCode: this.generateOrderCode(),
          status: OrderStatus.Pending,
          totalAmount: total.toFixed(2),
          shippingAddress: createOrderDto.shippingAddress,
          note: createOrderDto.note,
        });

        const savedOrder = await orderRepository.save(createdOrder);

        orderItems.forEach((orderItem) => {
          orderItem.orderId = savedOrder.id;
        });

        await orderItemRepository.save(orderItems);

        return orderRepository.findOneOrFail({
          where: {
            id: savedOrder.id,
          },
          relations: {
            items: true,
            payment: true,
          },
        });
      });

      await this.cartService.clearCart(userId);

      return {
        message: translate(this.i18n, 'orders.messages.created'),
        order: OrderResponseDto.createFromOrder(order),
      };
    } finally {
      try {
        await this.redisService.delIfValue(checkoutLockKey, checkoutLockToken);
      } catch (error) {
        this.logger.warn(
          `Failed to release checkout lock ${checkoutLockKey}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  async findMyOrders(userId: number) {
    const orders = await this.ordersRepository.find({
      where: {
        userId,
      },
      relations: {
        items: true,
        payment: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      orders: orders.map((order) => OrderResponseDto.createFromOrder(order)),
      total: orders.length,
    };
  }

  async findAdminOrders() {
    const orders = await this.ordersRepository.find({
      relations: {
        items: true,
        payment: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      orders: orders.map((order) => OrderResponseDto.createFromOrder(order)),
      total: orders.length,
    };
  }

  async cancel(userId: number, orderId: number) {
    const updatedOrder = await this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(Order);
      const productRepository = manager.getRepository(Product);
      const paymentRepository = manager.getRepository(Payment);

      const order = await orderRepository.findOne({
        where: {
          id: orderId,
        },
        relations: {
          items: true,
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
          translate(this.i18n, 'orders.errors.forbidden'),
        );
      }

      if (order.status !== OrderStatus.Pending) {
        throw new BadRequestException(
          translate(this.i18n, 'orders.errors.cannotCancel'),
        );
      }

      if (order.payment?.status === PaymentStatus.Paid) {
        throw new BadRequestException(
          translate(this.i18n, 'orders.errors.cannotCancelPaid'),
        );
      }

      const orderedItems = [...order.items].sort(
        (firstItem, secondItem) => firstItem.productId - secondItem.productId,
      );

      for (const item of orderedItems) {
        const product = await productRepository.findOne({
          where: {
            id: item.productId,
          },
          withDeleted: true,
          lock: {
            mode: 'pessimistic_write',
          },
        });

        if (!product) {
          throw new NotFoundException(
            translate(this.i18n, 'products.errors.notFound'),
          );
        }

        product.stock += item.quantity;

        await productRepository.save(product);
      }

      if (order.payment?.status === PaymentStatus.Pending) {
        order.payment.status = PaymentStatus.Failed;

        await paymentRepository.save(order.payment);
      }

      order.status = OrderStatus.Canceled;

      return orderRepository.save(order);
    });

    return {
      message: translate(this.i18n, 'orders.messages.canceled'),
      order: OrderResponseDto.createFromOrder(updatedOrder),
    };
  }

  async updateStatus(orderId: number, nextStatus: OrderStatus) {
    let updatedOrder: Order;

    try {
      updatedOrder = await this.dataSource.transaction(async (manager) => {
        const orderRepository = manager.getRepository(Order);
        const paymentRepository = manager.getRepository(Payment);

        const order = await orderRepository.findOne({
          where: {
            id: orderId,
          },
          relations: {
            items: true,
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

        const allowedNextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
          [OrderStatus.Pending]: OrderStatus.Confirmed,
          [OrderStatus.Confirmed]: OrderStatus.Shipping,
          [OrderStatus.Shipping]: OrderStatus.Done,
        };

        if (allowedNextStatus[order.status] !== nextStatus) {
          throw new BadRequestException(
            translate(this.i18n, 'orders.errors.invalidStatusTransition'),
          );
        }

        if (!order.payment) {
          throw new BadRequestException(
            translate(this.i18n, 'orders.errors.paymentRequired'),
          );
        }

        if (
          order.payment.status === PaymentStatus.Failed ||
          order.payment.status === PaymentStatus.Refunded ||
          (order.payment.method === PaymentMethod.Bank &&
            order.payment.status !== PaymentStatus.Paid)
        ) {
          throw new BadRequestException(
            translate(this.i18n, 'orders.errors.paymentNotCompleted'),
          );
        }

        if (
          nextStatus === OrderStatus.Done &&
          order.payment.status === PaymentStatus.Pending
        ) {
          order.payment.status = PaymentStatus.Paid;
          order.payment.paidAt = new Date();
          await paymentRepository.save(order.payment);
        }

        order.status = nextStatus;

        return orderRepository.save(order);
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Failed to update order ${orderId} status to ${nextStatus}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        translate(this.i18n, 'orders.errors.statusUpdateFailed'),
      );
    }

    return {
      message: translate(this.i18n, 'orders.messages.statusUpdated'),
      order: OrderResponseDto.createFromOrder(updatedOrder),
    };
  }

  async getOrderOrThrow(orderId: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: {
        id: orderId,
      },
      relations: {
        items: true,
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException(
        translate(this.i18n, 'orders.errors.notFound'),
      );
    }

    return order;
  }

  private generateOrderCode(): string {
    return `ORD-${Date.now()}`;
  }

  private getCheckoutLockKey(userId: number): string {
    return `checkout:${userId}`;
  }
}
