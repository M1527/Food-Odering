import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDailyReportsTable1784100000000 implements MigrationInterface {
  name = 'CreateDailyReportsTable1784100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE `daily_reports` (`id` int NOT NULL AUTO_INCREMENT, `reportDate` date NOT NULL, `totalOrders` int NOT NULL, `totalRevenue` decimal(10,2) NOT NULL, `newUsers` int NOT NULL, `sentToEmail` varchar(255) NOT NULL, `sentAt` datetime NULL, UNIQUE INDEX `IDX_daily_reports_report_date` (`reportDate`), PRIMARY KEY (`id`)) ENGINE=InnoDB',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `daily_reports`');
  }
}
