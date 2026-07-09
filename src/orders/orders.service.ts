import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { DataSource, Repository } from 'typeorm';

import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { Product, ProductStatus } from '../products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,

    private readonly cartService: CartService,
    private readonly productsService: ProductsService,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  async create(userId: number, createOrderDto: CreateOrderDto) {
    const cart = await this.cartService.getCart(userId);

    if (!cart.items.length) {
      throw new BadRequestException(
        this.translate('orders.errors.cartEmpty'),
      );
    }

    const order = await this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(Order);
      const orderItemRepository = manager.getRepository(OrderItem);
      const productRepository = manager.getRepository(Product);

      const createdOrder = orderRepository.create({
        userId,
        orderCode: this.generateOrderCode(),
        status: OrderStatus.Pending,
        totalAmount: cart.total,
        shippingAddress: createOrderDto.shippingAddress,
        note: createOrderDto.note,
      });

      const savedOrder = await orderRepository.save(createdOrder);

      const orderItems: OrderItem[] = [];

      for (const cartItem of cart.items) {
        const product = await productRepository.findOne({
          where: {
            id: cartItem.product.id,
          },
        });

        if (!product) {
          throw new NotFoundException(
            this.translate('products.errors.notFound'),
          );
        }

        if (product.status !== ProductStatus.Active) {
          throw new BadRequestException(
            this.translate('orders.errors.productInactive'),
          );
        }

        if (product.stock < cartItem.quantity) {
          throw new BadRequestException(
            this.translate('orders.errors.exceedStock'),
          );
        }

        product.stock -= cartItem.quantity;
        await productRepository.save(product);

        const orderItem = orderItemRepository.create({
          orderId: savedOrder.id,
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity: cartItem.quantity,
          subtotal: cartItem.subtotal,
        });

        orderItems.push(orderItem);
      }

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
      message: this.translate('orders.messages.created'),
      order: OrderResponseDto.createFromOrder(order),
    };
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
      throw new NotFoundException(this.translate('orders.errors.notFound'));
    }

    if (order.userId !== userId) {
      throw new ForbiddenException(this.translate('orders.errors.forbidden'));
    }

    if (order.status !== OrderStatus.Pending) {
      throw new BadRequestException(
        this.translate('orders.errors.cannotCancel'),
      );
    }

    order.status = OrderStatus.Canceled;

    const updatedOrder = await this.ordersRepository.save(order);

    return {
      message: this.translate('orders.messages.canceled'),
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
      throw new NotFoundException(this.translate('orders.errors.notFound'));
    }

    return order;
  }

  private generateOrderCode(): string {
    return `ORD-${Date.now()}`;
  }

  private translate(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang });
  }
}