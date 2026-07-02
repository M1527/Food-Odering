import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { ProfilesModule } from '../profiles/profiles.module';
import { RedisModule } from '../redis/redis.module';
import { UserSessionsModule } from '../user-sessions/user-sessions.module';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    JwtModule.register({}),
    RedisModule,
    ProfilesModule,
    UserSessionsModule,
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}