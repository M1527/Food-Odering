import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

import { DailyReportEmailData } from './interfaces/daily-report-email.interface';

@Injectable()
export class MailService {
  private transporter?: Transporter;

  constructor(private readonly configService: ConfigService) {}

  async sendDailyReport(
    recipient: string,
    report: DailyReportEmailData,
  ): Promise<void> {
    await this.getTransporter().sendMail({
      from:
        this.configService.get<string>('MAIL_FROM') ??
        this.getRequiredConfig('MAIL_USERNAME'),
      to: recipient,
      subject: `Báo cáo bán hàng ngày ${report.reportDate}`,
      html: this.createDailyReportHtml(report),
      headers: {
        'Resend-Idempotency-Key': `daily-report/${report.reportDate}/${recipient}`,
      },
    });
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const port = Number(this.configService.get<string>('MAIL_PORT') ?? 587);

    this.transporter = nodemailer.createTransport({
      host: this.getRequiredConfig('MAIL_HOST'),
      port,
      secure: port === 465,
      auth: {
        user: this.getRequiredConfig('MAIL_USERNAME'),
        pass: this.getRequiredConfig('MAIL_PASSWORD'),
      },
    });

    return this.transporter;
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }

    return value;
  }

  private createDailyReportHtml(report: DailyReportEmailData): string {
    const statusRows = Object.entries(report.ordersByStatus)
      .map(
        ([status, count]) =>
          `<tr><td>${this.escapeHtml(status)}</td><td>${count}</td></tr>`,
      )
      .join('');
    const productRows = report.bestSellingProducts.length
      ? report.bestSellingProducts
          .map(
            (product) =>
              `<tr><td>${this.escapeHtml(product.name)}</td><td>${product.soldQuantity}</td></tr>`,
          )
          .join('')
      : '<tr><td colspan="2">Không có sản phẩm nào được bán</td></tr>';
    const revenue = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(report.totalRevenue);

    return `
      <h2>Báo cáo bán hàng ngày ${this.escapeHtml(report.reportDate)}</h2>
      <p><strong>Tổng đơn hàng:</strong> ${report.totalOrders}</p>
      <p><strong>Tổng doanh thu đã thanh toán:</strong> ${revenue}</p>
      <p><strong>Người dùng mới:</strong> ${report.newUsers}</p>
      <h3>Đơn hàng theo trạng thái</h3>
      <table border="1" cellpadding="6" cellspacing="0">
        <thead><tr><th>Trạng thái</th><th>Số đơn</th></tr></thead>
        <tbody>${statusRows}</tbody>
      </table>
      <h3>Sản phẩm bán chạy</h3>
      <table border="1" cellpadding="6" cellspacing="0">
        <thead><tr><th>Sản phẩm</th><th>Số lượng</th></tr></thead>
        <tbody>${productRows}</tbody>
      </table>
    `;
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      };

      return entities[character];
    });
  }
}
