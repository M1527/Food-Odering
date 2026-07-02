import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { SignOptions } from 'jsonwebtoken';
import { I18nContext, I18nService } from 'nestjs-i18n';

import { RedisService } from '../redis/redis.service';
import { LoginDto } from '../users/dto/login.dto';
import { LogoutDto } from '../users/dto/logout.dto';
import { RefreshTokenDto } from '../users/dto/refresh-token.dto';
import { RegisterDto } from '../users/dto/register.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UsersService } from '../users/users.service';

type RefreshTokenPayload = {
  sub: number;
  email: string;
};

type DecodedToken = {
  sub?: number;
  exp?: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
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

    const accessToken = await this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.generateRefreshToken(user.id, user.email);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.usersService.updateRefreshTokenHash(
      user.id,
      refreshTokenHash,
    );

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
    const refreshToken = await this.generateRefreshToken(user.id, user.email);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.usersService.updateRefreshTokenHash(
      user.id,
      refreshTokenHash,
    );

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

    const isBlacklisted = await this.redisService.exists(
      `blacklist:${refreshTokenDto.refreshToken}`,
    );

    if (isBlacklisted) {
      throw new UnauthorizedException(
        this.translate('auth.errors.unauthorized'),
      );
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user.refreshTokenHash) {
      throw new UnauthorizedException(
        this.translate('auth.errors.unauthorized'),
      );
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshTokenDto.refreshToken,
      user.refreshTokenHash,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException(
        this.translate('auth.errors.unauthorized'),
      );
    }

    const accessToken = await this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.generateRefreshToken(user.id, user.email);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.usersService.updateRefreshTokenHash(
      user.id,
      refreshTokenHash,
    );

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
      await this.blacklistToken(accessToken, accessTokenPayload.exp);
    }

    if (refreshTokenPayload?.exp) {
      await this.blacklistToken(
        logoutDto.refreshToken,
        refreshTokenPayload.exp,
      );
    }

    if (accessTokenPayload?.sub) {
      await this.usersService.updateRefreshTokenHash(
        accessTokenPayload.sub,
        null,
      );
    }

    return {
      message: this.translate('auth.messages.loggedOut'),
    };
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
  ): Promise<string> {
    const expiresIn = this.configService.getOrThrow<
      SignOptions['expiresIn']
    >('JWT_REFRESH_EXPIRES_IN');

    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
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

  private async blacklistToken(token: string, exp: number): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const ttl = exp - now;

    if (ttl <= 0) {
      return;
    }

    await this.redisService.set(`blacklist:${token}`, '1', ttl);
  }

  private translate(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang });
  }
}