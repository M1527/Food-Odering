import { ApiProperty } from '@nestjs/swagger';

import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../entities/payment.entity';

export class PaymentResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  orderId!: number;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.Cod,
  })
  method!: PaymentMethod;

  @ApiProperty({
    enum: PaymentStatus,
    example: PaymentStatus.Pending,
  })
  status!: PaymentStatus;

  @ApiProperty({ example: '70000.00' })
  amount!: string;

  @ApiProperty({ example: '2026-07-09T09:00:00.000Z', nullable: true })
  paidAt?: Date;

  @ApiProperty({ example: '2026-07-09T09:00:00.000Z' })
  createdAt!: Date;

  static createFromPayment(payment: Payment): PaymentResponseDto {
    const dto = new PaymentResponseDto();

    dto.id = payment.id;
    dto.orderId = payment.orderId;
    dto.method = payment.method;
    dto.status = payment.status;
    dto.amount = payment.amount;
    dto.paidAt = payment.paidAt;
    dto.createdAt = payment.createdAt;

    return dto;
  }
}