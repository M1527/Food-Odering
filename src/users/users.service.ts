import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';

import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    private readonly i18n: I18nService,
  ) {}

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(this.translate('users.errors.notFound'));
    }

    return user;
  }

  async getCurrentUser(id: number): Promise<UserResponseDto> {
    const user = await this.findById(id);

    return UserResponseDto.createFromUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async create(user: Partial<User>): Promise<User> {
    const createdUser = this.usersRepository.create(user);

    return this.usersRepository.save(createdUser);
  }

  async updateRefreshTokenHash(
    userId: number,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.usersRepository.update(userId, {
      refreshTokenHash,
    });
  }

  private translate(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang });
  }
}