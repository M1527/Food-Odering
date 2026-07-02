import 'dotenv/config';

import { DataSource } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { UserSession } from '../user-sessions/entities/user-session.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Profile, UserSession],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});