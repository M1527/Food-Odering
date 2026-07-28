import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Order } from '../../orders/entities/order.entity';

export enum PaymentMethod {
  Cod = 'COD',
  Bank = 'BANK',
}

export enum PaymentStatus {
  Pending = 'PENDING',
  Paid = 'PAID',
  Failed = 'FAILED',
  Refunded = 'REFUNDED',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    unique: true,
  })
  orderId!: number;

  @OneToOne(() => Order, (order) => order.payment, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'orderId',
  })
  order!: Order;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method!: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.Pending,
  })
  status!: PaymentStatus;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  amount!: string;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  paidAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}