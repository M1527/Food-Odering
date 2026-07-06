import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { CategoryStatus } from '../entities/category.entity';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Coffee' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Các loại cà phê' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: CategoryStatus,
    example: CategoryStatus.Active,
  })
  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;
}