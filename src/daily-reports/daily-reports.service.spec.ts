import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { MailService } from '../mail/mail.service';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../payments/entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { DailyReportsService } from './daily-reports.service';
import { DailyReport } from './entities/daily-report.entity';

describe('DailyReportsService', () => {
  let service: DailyReportsService;
  const ordersRepository = { createQueryBuilder: jest.fn() };
  const orderItemsRepository = { createQueryBuilder: jest.fn() };
  const paymentsRepository = { createQueryBuilder: jest.fn() };
  const usersRepository = { createQueryBuilder: jest.fn() };
  const dailyReportsRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mailService = {
    sendDailyReport: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyReportsService,
        {
          provide: getRepositoryToken(DailyReport),
          useValue: dailyReportsRepository,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: ordersRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: orderItemsRepository,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: paymentsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'ADMIN_REPORT_EMAIL' ? 'admin@example.com' : undefined,
            ),
          },
        },
      ],
    }).compile();

    service = module.get<DailyReportsService>(DailyReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('does not send a report that was already sent', async () => {
    dailyReportsRepository.findOne.mockResolvedValue({
      reportDate: '2026-07-14',
      sentAt: new Date(),
    });

    await expect(service.sendDailyReport('2026-07-14')).resolves.toEqual({
      sent: false,
      reportDate: '2026-07-14',
    });
    expect(mailService.sendDailyReport).not.toHaveBeenCalled();
  });

  it('builds, stores and sends the previous day report', async () => {
    const totalOrdersQuery = createQueryBuilderMock();
    const statusQuery = createQueryBuilderMock();
    const revenueQuery = createQueryBuilderMock();
    const productsQuery = createQueryBuilderMock();
    const usersQuery = createQueryBuilderMock();

    totalOrdersQuery.getCount.mockResolvedValue(3);
    statusQuery.getRawMany.mockResolvedValue([
      { status: 'DONE', count: '2' },
      { status: 'CANCELED', count: '1' },
    ]);
    revenueQuery.getRawOne.mockResolvedValue({ total: '150000.00' });
    productsQuery.getRawMany.mockResolvedValue([
      { productId: '7', name: 'Cà phê', soldQuantity: '4' },
    ]);
    usersQuery.getCount.mockResolvedValue(2);
    ordersRepository.createQueryBuilder
      .mockReturnValueOnce(totalOrdersQuery)
      .mockReturnValueOnce(statusQuery);
    paymentsRepository.createQueryBuilder.mockReturnValue(revenueQuery);
    orderItemsRepository.createQueryBuilder.mockReturnValue(productsQuery);
    usersRepository.createQueryBuilder.mockReturnValue(usersQuery);
    dailyReportsRepository.findOne.mockResolvedValue(null);
    dailyReportsRepository.create.mockReturnValue({});
    dailyReportsRepository.save.mockImplementation((report: unknown) =>
      Promise.resolve(report),
    );
    mailService.sendDailyReport.mockResolvedValue(undefined);

    await expect(service.sendDailyReport('2026-07-14')).resolves.toEqual({
      sent: true,
      reportDate: '2026-07-14',
    });
    expect(mailService.sendDailyReport).toHaveBeenCalledWith(
      'admin@example.com',
      expect.objectContaining({
        totalOrders: 3,
        totalRevenue: 150000,
        newUsers: 2,
        ordersByStatus: { DONE: 2, CANCELED: 1 },
        bestSellingProducts: [
          { productId: 7, name: 'Cà phê', soldQuantity: 4 },
        ],
      }),
    );
    expect(dailyReportsRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        reportDate: '2026-07-14',
        totalRevenue: '150000.00',
        sentAt: expect.any(Date) as Date,
      }),
    );
    expect(dailyReportsRepository.save).toHaveBeenCalledTimes(1);
  });

  it('does not store the report when sending the email fails', async () => {
    mockReportQueries();
    dailyReportsRepository.findOne.mockResolvedValue(null);
    dailyReportsRepository.create.mockReturnValue({});
    mailService.sendDailyReport.mockRejectedValue(
      new Error('SMTP unavailable'),
    );

    await expect(service.sendDailyReport('2026-07-14')).rejects.toThrow(
      'SMTP unavailable',
    );
    expect(dailyReportsRepository.save).not.toHaveBeenCalled();
  });

  function mockReportQueries(): void {
    const totalOrdersQuery = createQueryBuilderMock();
    const statusQuery = createQueryBuilderMock();
    const revenueQuery = createQueryBuilderMock();
    const productsQuery = createQueryBuilderMock();
    const usersQuery = createQueryBuilderMock();

    totalOrdersQuery.getCount.mockResolvedValue(0);
    statusQuery.getRawMany.mockResolvedValue([]);
    revenueQuery.getRawOne.mockResolvedValue({ total: '0' });
    productsQuery.getRawMany.mockResolvedValue([]);
    usersQuery.getCount.mockResolvedValue(0);
    ordersRepository.createQueryBuilder
      .mockReturnValueOnce(totalOrdersQuery)
      .mockReturnValueOnce(statusQuery);
    paymentsRepository.createQueryBuilder.mockReturnValue(revenueQuery);
    orderItemsRepository.createQueryBuilder.mockReturnValue(productsQuery);
    usersRepository.createQueryBuilder.mockReturnValue(usersQuery);
  }
});

function createQueryBuilderMock() {
  const queryBuilder = {
    select: jest.fn(),
    addSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    groupBy: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    innerJoin: jest.fn(),
    getCount: jest.fn(),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
  };

  for (const method of [
    'select',
    'addSelect',
    'where',
    'andWhere',
    'groupBy',
    'orderBy',
    'limit',
    'innerJoin',
  ] as const) {
    queryBuilder[method].mockReturnValue(queryBuilder);
  }

  return queryBuilder;
}
