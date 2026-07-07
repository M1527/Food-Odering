import { config } from 'dotenv';

import {
  Category,
  CategoryStatus,
} from '../../categories/entities/category.entity';
import { AppDataSource } from '../data-source';

config();

const categories = [
  {
    name: 'Milk Tea',
    description: 'Milk tea drinks',
    status: CategoryStatus.Active,
  },
  {
    name: 'Coffee',
    description: 'Coffee drinks',
    status: CategoryStatus.Active,
  },
  {
    name: 'Juice',
    description: 'Fresh juices',
    status: CategoryStatus.Active,
  },
  {
    name: 'Snack',
    description: 'Snacks',
    status: CategoryStatus.Active,
  },
];

async function seedCategories() {
  await AppDataSource.initialize();

  const categoryRepository = AppDataSource.getRepository(Category);

  for (const category of categories) {
    const existingCategory = await categoryRepository.findOne({
      where: {
        name: category.name,
      },
    });

    if (existingCategory) {
      continue;
    }

    await categoryRepository.save(categoryRepository.create(category));
  }

  await AppDataSource.destroy();
}

void seedCategories();
