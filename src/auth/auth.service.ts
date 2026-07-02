import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { SignOptions } from 'jsonwebtoken';
import { I18nContext, I18nService } from 'nestjs-i18n';

import { ProfilesService } from '../profiles/profiles.service';
import { RedisService } from '../redis/redis.service';
import { UserSessionsService } from '../user-sessions/user-sessions.service';
import { LoginDto } from '../users/dto/login.dto';
import { LogoutDto } from '../users/dto/logout.dto';
import { RefreshTokenDto } from '../users/dto/refresh-token.dto';
import { RegisterDto } from '../users/dto/register.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

type RefreshTokenPayload = {
  sub: number;
  email: string;
  sid: number;
  jti: string;
  exp: number;
};

type DecodedToken = {
  sub?: number;
  sid?: number;
  exp?: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
    private readonly userSessionsService: UserSessionsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(
      registerDto.email,
    );

    if (existingUser) {
      throw new ConflictException(this.translate('auth.errors.emailExists'));
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      email: registerDto.email,
      passwordHash,
      fullName: registerDto.fullName,
      phone: registerDto.phone,
    });

    await this.profilesService.createDefaultProfile(user);

    const accessToken = await this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.createRefreshTokenSession(user);

    return {
      message: this.translate('auth.messages.registered'),
      user: UserResponseDto.createFromUser(user),
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException(
        this.translate('auth.errors.invalidCredentials'),
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        this.translate('auth.errors.invalidCredentials'),
      );
    }

    const accessToken = await this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.createRefreshTokenSession(user);

    return {
      message: this.translate('auth.messages.loggedIn'),
      user: UserResponseDto.createFromUser(user),
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(
      refreshTokenDto.refreshToken,
    );

    this.validateRefreshTokenPayload(payload);

    const session =
      await this.userSessionsService.findValidSessionByIdAndRefreshToken(
        payload.sid,
        payload.sub,
        refreshTokenDto.refreshToken,
      );

    if (!session) {
      throw new UnauthorizedException(
        this.translate('auth.errors.unauthorized'),
      );
    }

    const user = await this.usersService.findById(payload.sub);

    await this.userSessionsService.deleteSessionById(
      session.id,
      user.id,
    );

    const accessToken = await this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.createRefreshTokenSession(user);

    return {
      message: this.translate('auth.messages.tokenRefreshed'),
      accessToken,
      refreshToken,
    };
  }

  async logout(accessToken: string, logoutDto: LogoutDto) {
    const accessTokenPayload = this.jwtService.decode(
      accessToken,
    ) as DecodedToken | null;

    const refreshTokenPayload = this.jwtService.decode(
      logoutDto.refreshToken,
    ) as DecodedToken | null;

    if (accessTokenPayload?.exp) {
      await this.blacklistAccessToken(accessToken, accessTokenPayload.exp);
    }

    if (
      typeof refreshTokenPayload?.sid === 'number' &&
      typeof refreshTokenPayload?.sub === 'number'
    ) {
      await this.userSessionsService.deleteSessionById(
        refreshTokenPayload.sid,
        refreshTokenPayload.sub,
      );
    }

    return {
      message: this.translate('auth.messages.loggedOut'),
    };
  }

  private async createRefreshTokenSession(user: User): Promise<string> {
    const session = await this.userSessionsService.createPendingSession(user);

    const refreshToken = await this.generateRefreshToken(
      user.id,
      user.email,
      session.id,
    );

    const refreshTokenPayload = this.jwtService.decode(
      refreshToken,
    ) as DecodedToken | null;

    await this.userSessionsService.updateRefreshToken(
      session.id,
      refreshToken,
      this.createExpiredAt(refreshTokenPayload?.exp),
    );

    return refreshToken;
  }

  private async generateAccessToken(
    userId: number,
    email: string,
  ): Promise<string> {
    const expiresIn = this.configService.getOrThrow<
      SignOptions['expiresIn']
    >('JWT_ACCESS_EXPIRES_IN');

    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn,
      },
    );
  }

  private async generateRefreshToken(
    userId: number,
    email: string,
    sessionId: number,
  ): Promise<string> {
    const expiresIn = this.configService.getOrThrow<
      SignOptions['expiresIn']
    >('JWT_REFRESH_EXPIRES_IN');

    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
        sid: sessionId,
        jti: randomUUID(),
      },
      {
        secret: this.configService.getOrThrow<string>(
          'JWT_REFRESH_SECRET',
        ),
        expiresIn,
      },
    );
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>(
            'JWT_REFRESH_SECRET',
          ),
        },
      );
    } catch {
      throw new UnauthorizedException(
        this.translate('auth.errors.unauthorized'),
      );
    }
  }

  private validateRefreshTokenPayload(payload: RefreshTokenPayload): void {
    if (
      typeof payload.sub !== 'number' ||
      typeof payload.sid !== 'number' ||
      typeof payload.email !== 'string' ||
      typeof payload.jti !== 'string'
    ) {
      throw new UnauthorizedException(
        this.translate('auth.errors.unauthorized'),
      );
    }
  }

  private async blacklistAccessToken(
    accessToken: string,
    exp: number,
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const ttl = exp - now;

    if (ttl <= 0) {
      return;
    }

    await this.redisService.set(`blacklist:${accessToken}`, '1', ttl);
  }

  private createExpiredAt(exp?: number): Date {
    if (!exp) {
      return new Date();
    }

    return new Date(exp * 1000);
  }

  private translate(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang });
  }
}