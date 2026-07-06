import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';

import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,

    private readonly i18n: I18nService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const existingCategory = await this.categoriesRepository.findOne({
      where: {
        name: createCategoryDto.name,
      },
    });

    if (existingCategory) {
      throw new ConflictException(
        this.translate('categories.errors.nameExists'),
      );
    }

    const category = this.categoriesRepository.create({
      name: createCategoryDto.name,
      description: createCategoryDto.description,
    });

    try {
      const savedCategory = await this.categoriesRepository.save(category);

      return {
        message: this.translate('categories.messages.created'),
        category: CategoryResponseDto.createFromCategory(savedCategory),
      };
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    const categories = await this.categoriesRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      categories: categories.map((category) =>
        CategoryResponseDto.createFromCategory(category),
      ),
      total: categories.length,
    };
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.getCategoryOrThrow(id);

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoriesRepository.findOne({
        where: {
          name: updateCategoryDto.name,
        },
      });

      if (existingCategory) {
        throw new ConflictException(
          this.translate('categories.errors.nameExists'),
        );
      }
    }

    Object.assign(category, updateCategoryDto);

    try {
      const updatedCategory = await this.categoriesRepository.save(category);

      return {
        message: this.translate('categories.messages.updated'),
        category: CategoryResponseDto.createFromCategory(updatedCategory),
      };
    } catch (error) {
      throw error;
    }
  }

  async getCategoryOrThrow(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
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

  private translate(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang });
  }
}