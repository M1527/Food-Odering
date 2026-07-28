import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.Cod,
  })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;
}