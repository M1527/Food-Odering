import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('daily_reports')
export class DailyReport {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'date',
    unique: true,
  })
  reportDate!: string;

  @Column({
    type: 'int',
  })
  totalOrders!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  totalRevenue!: string;

  @Column({
    type: 'int',
  })
  newUsers!: number;

  @Column()
  sentToEmail!: string;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  sentAt?: Date | null;
}
