import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MailService } from '../mail/mail.service';
import { DailyReportEmailData } from '../mail/interfaces/daily-report-email.interface';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { DailyReport } from './entities/daily-report.entity';

@Injectable()
export class DailyReportsService {
  private readonly logger = new Logger(DailyReportsService.name);

  constructor(
    @InjectRepository(DailyReport)
    private readonly dailyReportsRepository: Repository<DailyReport>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  @Cron('30 0 * * *', {
    name: 'daily-admin-report',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleDailyReportCron(): Promise<void> {
    try {
      await this.sendDailyReport();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send daily report: ${message}`);
    }
  }

  async sendDailyReport(
    reportDate = this.getPreviousReportDate(),
  ): Promise<{ sent: boolean; reportDate: string }> {
    const recipient = this.getAdminReportEmail();
    const existingReport = await this.dailyReportsRepository.findOne({
      where: { reportDate },
    });

    if (existingReport?.sentAt) {
      this.logger.log(`Daily report ${reportDate} was already sent`);
      return { sent: false, reportDate };
    }

    const report = await this.buildReport(reportDate);
    const dailyReport = existingReport ?? this.dailyReportsRepository.create();

    Object.assign(dailyReport, {
      reportDate,
      totalOrders: report.totalOrders,
      totalRevenue: report.totalRevenue.toFixed(2),
      newUsers: report.newUsers,
      sentToEmail: recipient,
      sentAt: null,
    });
    await this.dailyReportsRepository.save(dailyReport);

    await this.mailService.sendDailyReport(recipient, report);

    dailyReport.sentAt = new Date();
    await this.dailyReportsRepository.save(dailyReport);
    this.logger.log(`Daily report ${reportDate} sent to ${recipient}`);

    return { sent: true, reportDate };
  }

  private async buildReport(reportDate: string): Promise<DailyReportEmailData> {
    const { start, end } = this.getReportRange(reportDate);

    const totalOrdersQuery = this.ordersRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :start', { start })
      .andWhere('order.createdAt < :end', { end });
    const ordersByStatusQuery = this.ordersRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .where('order.createdAt >= :start', { start })
      .andWhere('order.createdAt < :end', { end })
      .groupBy('order.status');
    const revenueQuery = this.paymentsRepository
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.Paid })
      .andWhere('payment.paidAt >= :start', { start })
      .andWhere('payment.paidAt < :end', { end });
    const bestSellingProductsQuery = this.orderItemsRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .select('item.productId', 'productId')
      .addSelect('MAX(item.productName)', 'name')
      .addSelect('SUM(item.quantity)', 'soldQuantity')
      .where('order.createdAt >= :start', { start })
      .andWhere('order.createdAt < :end', { end })
      .andWhere('order.status != :canceled', {
        canceled: OrderStatus.Canceled,
      })
      .groupBy('item.productId')
      .orderBy('soldQuantity', 'DESC')
      .limit(5);
    const newUsersQuery = this.usersRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :start', { start })
      .andWhere('user.createdAt < :end', { end });

    const [totalOrders, statusRows, revenueRow, productRows, newUsers] =
      await Promise.all([
        totalOrdersQuery.getCount(),
        ordersByStatusQuery.getRawMany<{ status: string; count: string }>(),
        revenueQuery.getRawOne<{ total: string }>(),
        bestSellingProductsQuery.getRawMany<{
          productId: string;
          name: string;
          soldQuantity: string;
        }>(),
        newUsersQuery.getCount(),
      ]);

    return {
      reportDate,
      totalOrders,
      totalRevenue: Number(revenueRow?.total ?? 0),
      newUsers,
      ordersByStatus: Object.fromEntries(
        statusRows.map((row) => [row.status, Number(row.count)]),
      ),
      bestSellingProducts: productRows.map((row) => ({
        productId: Number(row.productId),
        name: row.name,
        soldQuantity: Number(row.soldQuantity),
      })),
    };
  }

  private getPreviousReportDate(now = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    const todayInBangkok = new Date(
      `${values.year}-${values.month}-${values.day}T00:00:00+07:00`,
    );
    todayInBangkok.setUTCDate(todayInBangkok.getUTCDate() - 1);

    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(todayInBangkok);
  }

  private getReportRange(reportDate: string): { start: Date; end: Date } {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
      throw new Error('reportDate must use YYYY-MM-DD format');
    }

    const start = new Date(`${reportDate}T00:00:00+07:00`);

    if (Number.isNaN(start.getTime())) {
      throw new Error('reportDate is invalid');
    }

    return {
      start,
      end: new Date(start.getTime() + 24 * 60 * 60 * 1000),
    };
  }

  private getAdminReportEmail(): string {
    const email = this.configService.get<string>('ADMIN_REPORT_EMAIL');

    if (!email) {
      throw new Error(
        'Missing required environment variable: ADMIN_REPORT_EMAIL',
      );
    }

    return email;
  }
}
