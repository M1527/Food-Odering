import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { DailyReportsService } from './daily-reports.service';

async function sendDailyReport(): Promise<void> {
  const reportDate = process.argv[2];
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const dailyReportsService = app.get(DailyReportsService);
    const result = await dailyReportsService.sendDailyReport(reportDate);

    if (result.sent) {
      console.log(`Đã gửi báo cáo ngày ${result.reportDate}.`);
      return;
    }

    console.log(`Báo cáo ngày ${result.reportDate} đã được gửi trước đó.`);
  } finally {
    await app.close();
  }
}

void sendDailyReport().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Không thể gửi báo cáo: ${message}`);
  process.exitCode = 1;
});
