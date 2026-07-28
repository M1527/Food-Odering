import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { ProductStatus } from '../entities/product.entity';

export enum ProductSort {
  Latest = 'latest',
  PriceAsc = 'price_asc',
  PriceDesc = 'price_desc',
}

export class QueryProductsDto {
  @ApiPropertyOptional({ example: 'trà sữa' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ example: '10000' })
  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @ApiPropertyOptional({ example: '50000' })
  @IsOptional()
  @IsNumberString()
  maxPrice?: string;

  @ApiPropertyOptional({
    enum: ProductStatus,
    example: ProductStatus.Active,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({
    enum: ProductSort,
    example: ProductSort.Latest,
  })
  @IsOptional()
  @IsEnum(ProductSort)
  sort?: ProductSort;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  limit?: number;
}