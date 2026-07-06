import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Profile } from '../../profiles/entities/profile.entity';
import { UserSession } from '../../user-sessions/entities/user-session.entity';

export enum UserRole {
  Guest = 'GUEST',
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

  @Column({
    unique: true,
  })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column()
  fullName!: string;

  @Column({
    nullable: true,
  })
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

  @OneToOne(() => Profile, (profile) => profile.user)
  profile!: Profile;

  @OneToMany(() => UserSession, (session) => session.user)
  sessions!: UserSession[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}