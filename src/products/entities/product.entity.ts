import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Category } from '../../categories/entities/category.entity';

export enum ProductStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  categoryId!: number;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'categoryId',
  })
  category!: Category;

  @Column()
  name!: string;

  @Column({
    type: 'text',
  })
  description!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  price!: string;

  @Column({
    type: 'int',
  })
  stock!: number;

  @Column({
    type: 'boolean',
    default: false,
  })
  isFeatured!: boolean;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.Active,
  })
  status!: ProductStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}