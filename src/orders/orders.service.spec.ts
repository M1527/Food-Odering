import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { DataSource } from 'typeorm';

import { CartService } from '../cart/cart.service';
import {
  PaymentMethod,
  PaymentStatus,
} from '../payments/entities/payment.entity';
import { RedisService } from '../redis/redis.service';
import { UserRole } from '../users/entities/user.entity';
import { Order, OrderStatus } from './entities/order.entity';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepository: {
    findAndCount: jest.Mock;
  };

  beforeEach(async () => {
    ordersRepository = {
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: ordersRepository,
        },
        {
          provide: EventEmitter2,
          useValue: {},
        },
        {
          provide: CartService,
          useValue: {},
        },
        {
          provide: RedisService,
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {},
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should paginate and filter current user orders', async () => {
    ordersRepository.findAndCount.mockResolvedValue([[createOrder()], 12]);

    const result = await service.findMyOrders(7, {
      status: OrderStatus.Pending,
      page: 2,
      limit: 5,
    });

    expect(ordersRepository.findAndCount).toHaveBeenCalledWith({
      where: {
        userId: 7,
        status: OrderStatus.Pending,
      },
      relations: {
        items: true,
        payment: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: 5,
      take: 5,
    });
    expect(result).toEqual(
      expect.objectContaining({
        total: 12,
        page: 2,
        limit: 5,
      }),
    );
  });

  it('should include customer data in paginated admin orders', async () => {
    ordersRepository.findAndCount.mockResolvedValue([[createOrder(true)], 1]);

    const result = await service.findAdminOrders({});

    expect(ordersRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        relations: {
          items: true,
          payment: true,
          user: true,
        },
        skip: 0,
        take: 20,
      }),
    );
    expect(result.orders[0].user).toEqual(
      expect.objectContaining({
        id: 7,
        email: 'customer@example.com',
        fullName: 'Customer',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        total: 1,
        page: 1,
        limit: 20,
      }),
    );
  });
});

function createOrder(withUser = false): Order {
  const now = new Date('2026-07-09T09:00:00.000Z');

  return {
    id: 1,
    userId: 7,
    orderCode: 'ORD-1',
    status: OrderStatus.Pending,
    totalAmount: '70000.00',
    shippingAddress: 'Bangkok',
    items: [],
    payment: {
      id: 1,
      orderId: 1,
      method: PaymentMethod.Cod,
      status: PaymentStatus.Pending,
      amount: '70000.00',
      createdAt: now,
    },
    user: withUser
      ? {
          id: 7,
          email: 'customer@example.com',
          fullName: 'Customer',
          role: UserRole.User,
        }
      : undefined,
    createdAt: now,
    updatedAt: now,
  } as Order;
}
