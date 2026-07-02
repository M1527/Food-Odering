import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  User = 'USER',
  Admin = 'ADMIN',
}

export enum UserStatus {
  Active = 'ACTIVE',
  Blocked = 'BLOCKED',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column()
  fullName!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.User,
  })
  role!: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.Active,
  })
  status!: UserStatus;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  refreshTokenHash!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}