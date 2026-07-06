import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';

import { CategoriesService } from '../categories/categories.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import {
  ProductSort,
  QueryProductsDto,
} from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductStatus } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    private readonly categoriesService: CategoriesService,
    private readonly i18n: I18nService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const category = await this.categoriesService.getCategoryOrThrow(
      createProductDto.categoryId,
    );

    const product = this.productsRepository.create({
      category,
      categoryId: category.id,
      name: createProductDto.name,
      description: createProductDto.description,
      price: createProductDto.price,
      stock: createProductDto.stock,
      isFeatured: createProductDto.isFeatured ?? false,
      status: createProductDto.status ?? ProductStatus.Active,
    });

    try {
      const savedProduct = await this.productsRepository.save(product);

      return {
        message: this.translate('products.messages.created'),
        product: ProductResponseDto.createFromProduct(savedProduct),
      };
    } catch (error) {
      throw error;
    }
  }

  async findAll(query: QueryProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (query.q?.trim()) {
      queryBuilder.andWhere(
        '(product.name LIKE :q OR product.description LIKE :q)',
        {
          q: `%${query.q.trim()}%`,
        },
      );
    }

    if (query.categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.minPrice) {
      queryBuilder.andWhere('product.price >= :minPrice', {
        minPrice: query.minPrice,
      });
    }

    if (query.maxPrice) {
      queryBuilder.andWhere('product.price <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('product.status = :status', {
        status: query.status,
      });
    }

    switch (query.sort) {
      case ProductSort.PriceAsc:
        queryBuilder.orderBy('product.price', 'ASC');
        break;
      case ProductSort.PriceDesc:
        queryBuilder.orderBy('product.price', 'DESC');
        break;
      default:
        queryBuilder.orderBy('product.createdAt', 'DESC');
        break;
    }

    const [products, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      products: products.map((product) =>
        ProductResponseDto.createFromProduct(product),
      ),
      total,
      page,
      limit,
    };
  }

  async findFeatured() {
    const products = await this.productsRepository.find({
      where: {
        isFeatured: true,
        status: ProductStatus.Active,
      },
      relations: {
        category: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      products: products.map((product) =>
        ProductResponseDto.createFromProduct(product),
      ),
      total: products.length,
    };
  }

  async findOne(id: number) {
    const product = await this.getProductOrThrow(id);

    return {
      product: ProductResponseDto.createFromProduct(product),
    };
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.getProductOrThrow(id);

    if (updateProductDto.categoryId) {
      const category = await this.categoriesService.getCategoryOrThrow(
        updateProductDto.categoryId,
      );

      product.category = category;
      product.categoryId = category.id;
    }

    Object.assign(product, {
      name: updateProductDto.name ?? product.name,
      description: updateProductDto.description ?? product.description,
      price: updateProductDto.price ?? product.price,
      stock: updateProductDto.stock ?? product.stock,
      isFeatured: updateProductDto.isFeatured ?? product.isFeatured,
      status: updateProductDto.status ?? product.status,
    });

    try {
      const updatedProduct = await this.productsRepository.save(product);

      return {
        message: this.translate('products.messages.updated'),
        product: ProductResponseDto.createFromProduct(updatedProduct),
      };
    } catch (error) {
      throw error;
    }
  }

  async getProductOrThrow(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: {
        id,
      },
      relations: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException(
        this.translate('products.errors.notFound'),
      );
    }

    return product;
  }

  private translate(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang });
  }
}