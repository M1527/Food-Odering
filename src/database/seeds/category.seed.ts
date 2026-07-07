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
    description: 'Các loại trà sữa',
    status: CategoryStatus.Active,
  },
  {
    name: 'Coffee',
    description: 'Các loại cà phê',
    status: CategoryStatus.Active,
  },
  {
    name: 'Juice',
    description: 'Các loại nước ép',
    status: CategoryStatus.Active,
  },
  {
    name: 'Snack',
    description: 'Đồ ăn nhẹ',
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

seedCategories();