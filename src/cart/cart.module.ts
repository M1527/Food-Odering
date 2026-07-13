import { Module } from '@nestjs/common';

import { ProductsModule } from '../products/products.module';
import { RedisModule } from '../redis/redis.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [RedisModule, ProductsModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}