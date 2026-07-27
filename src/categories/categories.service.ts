import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { EntityManager, Repository } from 'typeorm';

import { translate } from '../common/utils/i18n.util';
import { CategoryResponseDto } from './dto/category-response.dto';
import { Category, CategoryStatus } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,

    private readonly i18n: I18nService,
  ) {}

  async findAll() {
    const categories = await this.categoriesRepository.find({
      where: {
        status: CategoryStatus.Active,
      },
      order: {
        name: 'ASC',
      },
    });

    return {
      message: translate(this.i18n, 'categories.messages.found'),
      categories: categories.map((category) =>
        CategoryResponseDto.createFromCategory(category),
      ),
    };
  }

  async getCategoryOrThrow(
    id: number,
    manager?: EntityManager,
  ): Promise<Category> {
    const category = await this.getRepository(manager).findOne({
      where: {
        id,
      },
    });

    if (!category) {
      throw new NotFoundException(
        translate(this.i18n, 'categories.errors.notFound'),
      );
    }

    return category;
  }

  private getRepository(manager?: EntityManager): Repository<Category> {
    return manager?.getRepository(Category) ?? this.categoriesRepository;
  }
}
