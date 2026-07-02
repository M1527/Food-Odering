import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { RedisService } from '../redis/redis.service';

type JwtPayload = {
  sub: number;
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const authorization = req.headers.authorization;
    const token = authorization?.replace('Bearer ', '');

    if (token) {
      const isBlacklisted = await this.redisService.exists(
        `blacklist:${token}`,
      );

      if (isBlacklisted) {
        throw new UnauthorizedException();
      }
    }

    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}