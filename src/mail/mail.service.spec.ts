import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import nodemailer from 'nodemailer';

import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

describe('MailService', () => {
  let service: MailService;
  const sendMail = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail,
    } as never);

    const config: Record<string, string> = {
      MAIL_HOST: 'smtp.example.com',
      MAIL_PORT: '587',
      MAIL_USERNAME: 'sender@example.com',
      MAIL_PASSWORD: 'secret',
      MAIL_FROM: 'Food Ordering <sender@example.com>',
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => config[key]),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sends a formatted daily report to the recipient', async () => {
    sendMail.mockResolvedValue({ messageId: 'message-id' });

    await service.sendDailyReport('admin@example.com', {
      reportDate: '2026-07-14',
      totalOrders: 2,
      totalRevenue: 100000,
      newUsers: 1,
      ordersByStatus: { DONE: 2 },
      bestSellingProducts: [{ productId: 1, name: 'Trà sữa', soldQuantity: 3 }],
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'admin@example.com',
        subject: 'Báo cáo bán hàng ngày 2026-07-14',
        html: expect.stringContaining('Trà sữa') as string,
        headers: {
          'Resend-Idempotency-Key': 'daily-report/2026-07-14/admin@example.com',
        },
      }),
    );
  });
});
