import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from './redis/redis.module';
import * as path from 'path';

import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { Profile } from './profiles/entities/profile.entity';
import { ProfilesModule } from './profiles/profiles.module';
import { UserSession } from './user-sessions/entities/user-session.entity';
import { UserSessionsModule } from './user-sessions/user-sessions.module';
import { CategoriesModule } from './categories/categories.module';
import { Category } from './categories/entities/category.entity';
import { ProductsModule } from './products/products.module';
import { Product } from './products/entities/product.entity';
import { AttachmentsModule } from './attachments/attachments.module';
import { Attachment } from './attachments/entities/attachment.entity';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { Payment } from './payments/entities/payment.entity';
import { ReviewsModule } from './reviews/reviews.module';
import { Review } from './reviews/entities/review.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Notification } from './notifications/entities/notification.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { DailyReportsModule } from './daily-reports/daily-reports.module';
import { MailModule } from './mail/mail.module';
import { DailyReport } from './daily-reports/entities/daily-report.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    I18nModule.forRoot({
      fallbackLanguage: 'vi',
      loaderOptions: {
        path: path.join(process.cwd(), 'src/i18n/'),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<number>('DB_PORT') ?? 3306),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
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
          DailyReport,
        ],
        synchronize: false,
      }),
    }),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    EventEmitterModule.forRoot(),

    ScheduleModule.forRoot(),

    UsersModule,

    AuthModule,

    RedisModule,

    ProfilesModule,

    UserSessionsModule,

    CategoriesModule,

    ProductsModule,

    AttachmentsModule,

    CartModule,

    OrdersModule,

    PaymentsModule,

    ReviewsModule,

    NotificationsModule,

    DailyReportsModule,

    MailModule,
  ],
})
export class AppModule {}
