import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';

import { Category } from './entities/category.entity';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoriesRepository: {
    find: jest.Mock;
  };

  beforeEach(async () => {
    categoriesRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: categoriesRepository,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return active categories ordered by name', async () => {
    const now = new Date('2026-07-02T09:00:00.000Z');
    categoriesRepository.find.mockResolvedValue([
      {
        id: 1,
        name: 'Coffee',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const result = await service.findAll();

    expect(categoriesRepository.find).toHaveBeenCalledWith({
      where: {
        status: 'ACTIVE',
      },
      order: {
        name: 'ASC',
      },
    });
    expect(result.categories).toEqual([
      expect.objectContaining({
        id: 1,
        name: 'Coffee',
        status: 'ACTIVE',
      }),
    ]);
  });
});
