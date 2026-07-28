import { ApiProperty } from '@nestjs/swagger';

import { Review } from '../entities/review.entity';

export class ReviewUserResponseDto {
  @ApiProperty({
    example: 1,
  })
  id!: number;

  @ApiProperty({
    example: 'Nguyễn Văn A',
  })
  fullName!: string;
}

export class ReviewResponseDto {
  @ApiProperty({
    example: 1,
  })
  id!: number;

  @ApiProperty({
    example: 5,
  })
  rating!: number;

  @ApiProperty({
    example: 'Sản phẩm ngon',
  })
  comment!: string;

  @ApiProperty({
    type: ReviewUserResponseDto,
  })
  user!: ReviewUserResponseDto;

  @ApiProperty({
    example: 1,
  })
  productId!: number;

  @ApiProperty({
    example: '2026-07-10T00:00:00.000Z',
  })
  createdAt!: Date;

  static createFromReview(review: Review): ReviewResponseDto {
    const dto = new ReviewResponseDto();

    dto.id = review.id;
    dto.rating = review.rating;
    dto.comment = review.comment;
    dto.productId = review.productId;
    dto.createdAt = review.createdAt;
    dto.user = {
      id: review.user.id,
      fullName: review.user.fullName,
    };

    return dto;
  }
}