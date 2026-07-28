import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AttachmentObjectType {
  Product = 'PRODUCT',
  Review = 'REVIEW',
  ProductSuggestion = 'PRODUCT_SUGGESTION',
  UserAvatar = 'USER_AVATAR',
}

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  filename!: string;

  @Column()
  path!: string;

  @Column()
  url!: string;

  @Column()
  contentType!: string;

  @Column({
    type: 'int',
  })
  size!: number;

  @Column({
    type: 'enum',
    enum: AttachmentObjectType,
  })
  objectType!: AttachmentObjectType;

  @Column({
    type: 'int',
  })
  objectId!: number;

  @Column({
    type: 'json',
    nullable: true,
  })
  metadata?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deletedAt?: Date;
}