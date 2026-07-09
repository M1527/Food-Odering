import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PaymentResponseDto } from '../../payments/dto/payment-response.dto';
import { OrderItem } from '../entities/order-item.entity';
import { Order, OrderStatus } from '../entities/order.entity';

export class OrderItemResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  productId!: number;

  @ApiProperty({ example: 'Trà sữa trân châu' })
  productName!: string;

  @ApiProperty({ example: '35000.00' })
  unitPrice!: string;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ example: '70000.00' })
  subtotal!: string;

  static createFromOrderItem(orderItem: OrderItem): OrderItemResponseDto {
    const dto = new OrderItemResponseDto();

    dto.id = orderItem.id;
    dto.productId = orderItem.productId;
    dto.productName = orderItem.productName;
    dto.unitPrice = orderItem.unitPrice;
    dto.quantity = orderItem.quantity;
    dto.subtotal = orderItem.subtotal;

    return dto;
  }
}

export class OrderResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'ORD-20260709-000001' })
  orderCode!: string;

  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.Pending,
  })
  status!: OrderStatus;

  @ApiProperty({ example: '70000.00' })
  totalAmount!: string;

  @ApiProperty({ example: '123 Nguyễn Trãi, Quận 1, TP.HCM' })
  shippingAddress!: string;

  @ApiPropertyOptional({ example: 'Ít đá' })
  note?: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items!: OrderItemResponseDto[];

  @ApiPropertyOptional({ type: PaymentResponseDto })
  payment?: PaymentResponseDto;

  @ApiProperty({ example: '2026-07-09T09:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-07-09T09:00:00.000Z' })
  updatedAt!: Date;

  static createFromOrder(order: Order): OrderResponseDto {
    const dto = new OrderResponseDto();

    dto.id = order.id;
    dto.orderCode = order.orderCode;
    dto.status = order.status;
    dto.totalAmount = order.totalAmount;
    dto.shippingAddress = order.shippingAddress;
    dto.note = order.note;
    dto.items = (order.items ?? []).map((item) =>
      OrderItemResponseDto.createFromOrderItem(item),
    );
    dto.payment = order.payment
      ? PaymentResponseDto.createFromPayment(order.payment)
      : undefined;
    dto.createdAt = order.createdAt;
    dto.updatedAt = order.updatedAt;

    return dto;
  }
}