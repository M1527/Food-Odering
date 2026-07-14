import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import { translate } from '../common/utils/i18n.util';
import { ProductsService } from '../products/products.service';
import { ProductStatus } from '../products/entities/product.entity';
import { RedisService } from '../redis/redis.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CartItemResponseDto, CartResponseDto } from './dto/cart-response.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

type RedisCartItem = {
  productId: number;
  quantity: number;
};

@Injectable()
export class CartService {
  constructor(
    private readonly redisService: RedisService,
    private readonly productsService: ProductsService,
    private readonly i18n: I18nService,
  ) {}

  async getCart(userId: number): Promise<CartResponseDto> {
    const cartItems = await this.getCartItems(userId);
    const responseItems: CartItemResponseDto[] = [];

    let total = 0;

    for (const cartItem of cartItems) {
      const product = await this.productsService.getProductOrThrow(
        cartItem.productId,
      );

      const price = Number(product.price);
      const subtotal = price * cartItem.quantity;

      total += subtotal;

      responseItems.push({
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
        },
        quantity: cartItem.quantity,
        subtotal: subtotal.toFixed(2),
      });
    }

    return {
      items: responseItems,
      total: total.toFixed(2),
    };
  }

  async addItem(userId: number, addCartItemDto: AddCartItemDto) {
    const product = await this.productsService.getProductOrThrow(
      addCartItemDto.productId,
    );

    this.validateProductCanAddToCart(product.status, product.stock);

    const cartItems = await this.getCartItems(userId);
    const existingItem = cartItems.find(
      (item) => item.productId === addCartItemDto.productId,
    );

    if (existingItem) {
      const nextQuantity = existingItem.quantity + addCartItemDto.quantity;

      this.validateQuantity(nextQuantity, product.stock);

      existingItem.quantity = nextQuantity;
    } else {
      this.validateQuantity(addCartItemDto.quantity, product.stock);

      cartItems.push({
        productId: addCartItemDto.productId,
        quantity: addCartItemDto.quantity,
      });
    }

    await this.saveCartItems(userId, cartItems);

    return {
      message: translate(this.i18n, 'cart.messages.itemAdded'),
      cart: await this.getCart(userId),
    };
  }

  async updateItem(
    userId: number,
    productId: number,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const product = await this.productsService.getProductOrThrow(productId);

    this.validateProductCanAddToCart(product.status, product.stock);
    this.validateQuantity(updateCartItemDto.quantity, product.stock);

    const cartItems = await this.getCartItems(userId);
    const existingItem = cartItems.find((item) => item.productId === productId);

    if (!existingItem) {
      throw new NotFoundException(
        translate(this.i18n, 'cart.errors.itemNotFound'),
      );
    }

    existingItem.quantity = updateCartItemDto.quantity;

    await this.saveCartItems(userId, cartItems);

    return {
      message: translate(this.i18n, 'cart.messages.itemUpdated'),
      cart: await this.getCart(userId),
    };
  }

  async removeItem(userId: number, productId: number) {
    const cartItems = await this.getCartItems(userId);
    const nextCartItems = cartItems.filter(
      (item) => item.productId !== productId,
    );

    if (nextCartItems.length === cartItems.length) {
      throw new NotFoundException(
        translate(this.i18n, 'cart.errors.itemNotFound'),
      );
    }

    await this.saveCartItems(userId, nextCartItems);

    return {
      message: translate(this.i18n, 'cart.messages.itemRemoved'),
      cart: await this.getCart(userId),
    };
  }

  async clearCart(userId: number): Promise<void> {
    await this.redisService.del(this.getCartKey(userId));
  }

  private async getCartItems(userId: number): Promise<RedisCartItem[]> {
    const rawCart = await this.redisService.get(this.getCartKey(userId));

    if (!rawCart) {
      return [];
    }

    return JSON.parse(rawCart) as RedisCartItem[];
  }

  private async saveCartItems(
    userId: number,
    cartItems: RedisCartItem[],
  ): Promise<void> {
    if (!cartItems.length) {
      await this.redisService.del(this.getCartKey(userId));
      return;
    }

    await this.redisService.set(
      this.getCartKey(userId),
      JSON.stringify(cartItems),
    );
  }

  private getCartKey(userId: number): string {
    return `cart:${userId}`;
  }

  private validateProductCanAddToCart(
    status: ProductStatus,
    stock: number,
  ): void {
    if (status !== ProductStatus.Active) {
      throw new BadRequestException(
        translate(this.i18n, 'cart.errors.productInactive'),
      );
    }

    if (stock <= 0) {
      throw new BadRequestException(
        translate(this.i18n, 'cart.errors.outOfStock'),
      );
    }
  }

  private validateQuantity(quantity: number, stock: number): void {
    if (quantity > stock) {
      throw new BadRequestException(
        translate(this.i18n, 'cart.errors.exceedStock'),
      );
    }
  }
}
