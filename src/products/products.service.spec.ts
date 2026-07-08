import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { DataSource, EntityManager } from 'typeorm';

import {
  Attachment,
  AttachmentObjectType,
} from '../attachments/entities/attachment.entity';
import { AttachmentsService } from '../attachments/attachments.service';
import {
  Category,
  CategoryStatus,
} from '../categories/entities/category.entity';
import { CategoriesService } from '../categories/categories.service';
import { Product, ProductStatus } from './entities/product.entity';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let attachmentsService: {
    findProductAttachments: jest.Mock;
    createProductAttachments: jest.Mock;
    softDeleteProductAttachments: jest.Mock;
  };
  let dataSource: {
    transaction: jest.Mock;
  };
  let manager: EntityManager;

  beforeEach(async () => {
    productsRepository = {
      findOne: jest.fn(),
      save: jest.fn((product: Product) => Promise.resolve(product)),
    };
    manager = {
      getRepository: jest.fn().mockReturnValue(productsRepository),
    } as unknown as EntityManager;
    attachmentsService = {
      findProductAttachments: jest.fn(),
      createProductAttachments: jest.fn(),
      softDeleteProductAttachments: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(manager),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: productsRepository,
        },
        {
          provide: CategoriesService,
          useValue: {
            getCategoryOrThrow: jest.fn(),
          },
        },
        {
          provide: AttachmentsService,
          useValue: attachmentsService,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should keep current attachments when update receives no images', async () => {
    const product = createProduct();

    productsRepository.findOne.mockResolvedValue(product);
    attachmentsService.findProductAttachments.mockResolvedValue([]);

    await service.update(1, { name: 'Updated milk tea' });

    expect(productsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated milk tea',
      }),
    );
    expect(attachmentsService.findProductAttachments).toHaveBeenCalledWith(1);
    expect(
      attachmentsService.softDeleteProductAttachments,
    ).not.toHaveBeenCalled();
    expect(attachmentsService.createProductAttachments).not.toHaveBeenCalled();
  });

  it('should replace product attachments when update receives image array', async () => {
    const product = createProduct();
    const images = [createUploadedFile()];
    const attachment = createAttachment();

    productsRepository.findOne.mockResolvedValue(product);
    attachmentsService.createProductAttachments.mockResolvedValue([attachment]);

    const result = await service.update(1, {}, images);

    expect(
      attachmentsService.softDeleteProductAttachments,
    ).toHaveBeenCalledWith(1, manager);
    expect(attachmentsService.createProductAttachments).toHaveBeenCalledWith(
      product,
      images,
      manager,
    );
    expect(attachmentsService.findProductAttachments).not.toHaveBeenCalled();
    expect(result.product.attachments).toEqual([
      expect.objectContaining({
        id: attachment.id,
        url: attachment.url,
      }),
    ]);
  });
});

function createProduct(): Product {
  const now = new Date('2026-07-02T09:00:00.000Z');
  const category = {
    id: 1,
    name: 'Milk Tea',
    status: CategoryStatus.Active,
    createdAt: now,
    updatedAt: now,
  } as Category;

  return {
    id: 1,
    categoryId: category.id,
    category,
    name: 'Milk tea',
    description: 'Traditional milk tea',
    price: '35000.00',
    stock: 100,
    isFeatured: false,
    status: ProductStatus.Active,
    createdAt: now,
    updatedAt: now,
  };
}

function createUploadedFile(): Express.Multer.File {
  return {
    originalname: 'milk-tea.jpg',
    path: 'uploads/products/milk-tea.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
  } as Express.Multer.File;
}

function createAttachment(): Attachment {
  const now = new Date('2026-07-02T09:00:00.000Z');

  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    filename: 'milk-tea.jpg',
    path: 'uploads/products/milk-tea.jpg',
    url: 'https://api.example.com/uploads/products/milk-tea.jpg',
    contentType: 'image/jpeg',
    size: 1024,
    objectType: AttachmentObjectType.Product,
    objectId: 1,
    createdAt: now,
    updatedAt: now,
  };
}
