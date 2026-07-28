import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: '123 Nguyễn Trãi, Quận 1, TP.HCM' })
  @IsString()
  @IsNotEmpty()
  shippingAddress!: string;

  @ApiPropertyOptional({ example: 'Ít đá, giao giờ hành chính' })
  @IsOptional()
  @IsString()
  note?: string;
}