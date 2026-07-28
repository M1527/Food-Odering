import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.sessions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user!: User;

  @Column()
  userId!: number;

  @Column()
  refreshTokenHash!: string;

  @Column()
  expiredAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}