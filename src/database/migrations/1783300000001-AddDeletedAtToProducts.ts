import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToProducts1783300000001
  implements MigrationInterface
{
  name = 'AddDeletedAtToProducts1783300000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `products` ADD `deletedAt` datetime(6) NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `products` DROP COLUMN `deletedAt`',
    );
  }
}
