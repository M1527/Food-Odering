import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { unlink } from 'fs/promises';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { AttachmentsService } from '../attachments/attachments.service';
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
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    private readonly categoriesService: CategoriesService,
    private readonly attachmentsService: AttachmentsService,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    images: Express.Multer.File[] = [],
  ) {
    let result: Awaited<
      ReturnType<typeof this.createProductWithAttachments>
    >;

    try {
      result = await this.dataSource.transaction((manager) =>
        this.createProductWithAttachments(
          createProductDto,
          images,
          manager,
        ),
      );
    } catch (error) {
      await this.deleteUploadedFiles(images);
      throw error;
    }

    return {
      message: this.translate('products.messages.created'),
      product: ProductResponseDto.createFromProduct(
        result.product,
        result.attachments,
      ),
    };
  }

  private async createProductWithAttachments(
    createProductDto: CreateProductDto,
    images: Express.Multer.File[],
    manager: EntityManager,
  ) {
    const category = await this.categoriesService.getCategoryOrThrow(
      createProductDto.categoryId,
      manager,
    );
    const productRepository = manager.getRepository(Product);

    const product = productRepository.create({
      category,
      categoryId: category.id,
      name: createProductDto.name,
      description: createProductDto.description,
      price: createProductDto.price,
      stock: createProductDto.stock,
      isFeatured: createProductDto.isFeatured ?? false,
      status: createProductDto.status ?? ProductStatus.Active,
    });

    const savedProduct = await productRepository.save(product);

    const savedAttachments =
      await this.attachmentsService.createProductAttachments(
        savedProduct,
        images,
        manager,
      );

    return {
      product: savedProduct,
      attachments: savedAttachments,
    };
  }

  private async deleteUploadedFiles(
    files: Express.Multer.File[],
  ): Promise<void> {
    await Promise.all(
      files.map(async (file) => {
        if (!file.path) {
          return;
        }

        try {
          await unlink(file.path);
        } catch (error) {
          this.logger.warn(
            `Failed to delete uploaded file ${file.path}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }),
    );
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

    const attachmentMap =
      await this.attachmentsService.findProductAttachmentsByProductIds(
        products.map((product) => product.id),
      );

    return {
      products: products.map((product) =>
        ProductResponseDto.createFromProduct(
          product,
          attachmentMap.get(product.id) ?? [],
        ),
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

    const attachmentMap =
      await this.attachmentsService.findProductAttachmentsByProductIds(
        products.map((product) => product.id),
      );

    return {
      products: products.map((product) =>
        ProductResponseDto.createFromProduct(
          product,
          attachmentMap.get(product.id) ?? [],
        ),
      ),
      total: products.length,
    };
  }

  async findOne(id: number) {
    const product = await this.getProductOrThrow(id);
    const attachments =
      await this.attachmentsService.findProductAttachments(product.id);

    return {
      product: ProductResponseDto.createFromProduct(product, attachments),
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

    const updatedProduct = await this.productsRepository.save(product);
    const attachments =
      await this.attachmentsService.findProductAttachments(updatedProduct.id);

    return {
      message: this.translate('products.messages.updated'),
      product: ProductResponseDto.createFromProduct(
        updatedProduct,
        attachments,
      ),
    };
  }

  async remove(id: number) {
    await this.dataSource.transaction(async (manager) => {
      await this.getProductOrThrow(id, manager);
      await this.attachmentsService.softDeleteProductAttachments(
        id,
        manager,
      );
      await manager.getRepository(Product).softDelete(id);
    });

    return {
      message: this.translate('products.messages.deleted'),
    };
  }

  async getProductOrThrow(
    id: number,
    manager?: EntityManager,
  ): Promise<Product> {
    const product = await this.getRepository(manager).findOne({
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

  private getRepository(manager?: EntityManager): Repository<Product> {
    return manager?.getRepository(Product) ?? this.productsRepository;
  }

  private translate(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang });
  }
}
