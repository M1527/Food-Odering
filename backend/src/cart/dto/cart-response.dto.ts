import { ApiProperty } from '@nestjs/swagger';

export class CartProductDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Trà sữa trân châu' })
  name!: string;

  @ApiProperty({ example: '35000.00' })
  price!: string;

  @ApiProperty({ example: 100 })
  stock!: number;
}

export class CartItemResponseDto {
  @ApiProperty({ type: CartProductDto })
  product!: CartProductDto;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ example: '70000.00' })
  subtotal!: string;
}

export class CartResponseDto {
  @ApiProperty({ type: [CartItemResponseDto] })
  items!: CartItemResponseDto[];

  @ApiProperty({ example: '70000.00' })
  total!: string;
}