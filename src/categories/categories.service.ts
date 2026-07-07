import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { EntityManager, Repository } from 'typeorm';

import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,

    private readonly i18n: I18nService,
  ) {}

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
        this.translate('categories.errors.notFound'),
      );
    }

    return category;
  }

  private getRepository(manager?: EntityManager): Repository<Category> {
    return manager?.getRepository(Category) ?? this.categoriesRepository;
  }

  private translate(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang });
  }
}
