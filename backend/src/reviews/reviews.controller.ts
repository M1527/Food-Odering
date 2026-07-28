import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { ReviewsService } from './reviews.service';

type AuthenticatedRequest = Request & {
  user: {
    userId: number;
    email: string;
  };
};

@ApiTags('reviews')
@Controller('products/:id/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Param('id', ParseIntPipe) productId: number,
    @Req() request: AuthenticatedRequest,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(
      productId,
      request.user.userId,
      createReviewDto,
    );
  }

  @Get()
  findAll(
    @Param('id', ParseIntPipe) productId: number,
    @Query() query: QueryReviewsDto,
  ) {
    return this.reviewsService.findAll(productId, query);
  }
}