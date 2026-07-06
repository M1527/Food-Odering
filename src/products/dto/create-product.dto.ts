import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { ProductStatus } from '../entities/product.entity';

export class CreateProductDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  categoryId!: number;

  @ApiProperty({ example: 'Trà sữa trân châu' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Trà sữa truyền thống kèm trân châu đen' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: '35000' })
  @IsNumberString()
  price!: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    enum: ProductStatus,
    example: ProductStatus.Active,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}