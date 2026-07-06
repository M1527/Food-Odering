import { ApiProperty } from '@nestjs/swagger';

import { CategoryResponseDto } from '../../categories/dto/category-response.dto';
import { Product, ProductStatus } from '../entities/product.entity';

export class ProductResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  categoryId!: number;

  @ApiProperty({ example: 'Trà sữa trân châu' })
  name!: string;

  @ApiProperty({ example: 'Trà sữa truyền thống kèm trân châu đen' })
  description!: string;

  @ApiProperty({ example: '35000.00' })
  price!: string;

  @ApiProperty({ example: 100 })
  stock!: number;

  @ApiProperty({ example: true })
  isFeatured!: boolean;

  @ApiProperty({
    enum: ProductStatus,
    example: ProductStatus.Active,
  })
  status!: ProductStatus;

  @ApiProperty({ type: CategoryResponseDto })
  category!: CategoryResponseDto;

  @ApiProperty({ example: '2026-07-02T09:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-07-02T09:00:00.000Z' })
  updatedAt!: Date;

  static createFromProduct(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();

    dto.id = product.id;
    dto.categoryId = product.categoryId;
    dto.name = product.name;
    dto.description = product.description;
    dto.price = product.price;
    dto.stock = product.stock;
    dto.isFeatured = product.isFeatured;
    dto.status = product.status;
    dto.category = CategoryResponseDto.createFromCategory(product.category);
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;

    return dto;
  }
}