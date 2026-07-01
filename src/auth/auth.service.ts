import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { JwtService } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { RegisterDto } from '../users/dto/register.dto';
import { LoginDto } from '../users/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

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

    return {
      message: this.translate('auth.messages.registered'),
      user: UserResponseDto.createFromUser(user),
      accessToken: await this.generateAccessToken(user.id, user.email),
      refreshToken: await this.generateRefreshToken(user.id, user.email),
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

    return {
      message: this.translate('auth.messages.loggedIn'),
      user: UserResponseDto.createFromUser(user),
      accessToken: await this.generateAccessToken(user.id, user.email),
      refreshToken: await this.generateRefreshToken(user.id, user.email),
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

  private translate(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang });
  }
}