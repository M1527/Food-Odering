import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Category, CategoryStatus } from '../entities/category.entity';

export class CategoryResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Milk Tea' })
  name!: string;

  @ApiPropertyOptional({ example: 'Các loại trà sữa' })
  description?: string;

  @ApiProperty({
    enum: CategoryStatus,
    example: CategoryStatus.Active,
  })
  status!: CategoryStatus;

  @ApiProperty({ example: '2026-07-02T09:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-07-02T09:00:00.000Z' })
  updatedAt!: Date;

  static createFromCategory(category: Category): CategoryResponseDto {
    const dto = new CategoryResponseDto();

    dto.id = category.id;
    dto.name = category.name;
    dto.description = category.description;
    dto.status = category.status;
    dto.createdAt = category.createdAt;
    dto.updatedAt = category.updatedAt;

    return dto;
  }
}