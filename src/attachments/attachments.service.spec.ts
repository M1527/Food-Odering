import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { Attachment } from './entities/attachment.entity';
import { AttachmentsService } from './attachments.service';

describe('AttachmentsService', () => {
  let service: AttachmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsService,
        {
          provide: getRepositoryToken(Attachment),
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('https://api.example.com'),
          },
        },
      ],
    }).compile();

    service = module.get<AttachmentsService>(AttachmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create attachment urls from APP_URL', async () => {
    const create = jest.fn(
      (attachment: Partial<Attachment>) => attachment as Attachment,
    );
    const save = jest.fn((attachments: Attachment[]) =>
      Promise.resolve(attachments),
    );
    const repository = { create, save } as unknown as Repository<Attachment>;
    const manager = {
      getRepository: jest.fn().mockReturnValue(repository),
    } as unknown as EntityManager;

    const result = await service.createProductAttachments(
      { id: 1 } as Product,
      [
        {
          originalname: 'milk-tea.jpg',
          path: 'uploads\\products\\milk-tea.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
        } as Express.Multer.File,
      ],
      manager,
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'uploads/products/milk-tea.jpg',
        url: 'https://api.example.com/uploads/products/milk-tea.jpg',
      }),
    );
    expect(result).toEqual([
      expect.objectContaining({
        path: 'uploads/products/milk-tea.jpg',
        url: 'https://api.example.com/uploads/products/milk-tea.jpg',
      }),
    ]);
  });
});
