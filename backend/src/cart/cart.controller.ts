import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartService } from './cart.service';

type AuthenticatedRequest = Request & {
  user: {
    userId: number;
    email: string;
  };
};

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() request: AuthenticatedRequest) {
    return this.cartService.getCart(request.user.userId);
  }

  @Post('items')
  addItem(
    @Req() request: AuthenticatedRequest,
    @Body() addCartItemDto: AddCartItemDto,
  ) {
    return this.cartService.addItem(
      request.user.userId,
      addCartItemDto,
    );
  }

  @Patch('items/:productId')
  updateItem(
    @Req() request: AuthenticatedRequest,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(
      request.user.userId,
      productId,
      updateCartItemDto,
    );
  }

  @Delete('items/:productId')
  removeItem(
    @Req() request: AuthenticatedRequest,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.cartService.removeItem(request.user.userId, productId);
  }
}