import 'dotenv/config';

import { DataSource } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { UserSession } from '../user-sessions/entities/user-session.entity';
import { Attachment } from '../attachments/entities/attachment.entity';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Review } from '../reviews/entities/review.entity';
import { Notification } from '../notifications/entities/notification.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
  User,
  Profile,
  UserSession,
  Category,
  Product,
  Attachment,
  Order,
  OrderItem,
  Payment,
  Review,
  Notification,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});