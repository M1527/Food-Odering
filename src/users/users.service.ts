import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';

import { translate } from '../common/utils/i18n.util';
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
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException(
        translate(this.i18n, 'users.errors.notFound'),
      );
    }

    return user;
  }

  async getCurrentUser(id: number): Promise<UserResponseDto> {
    const user = await this.findById(id);

    return UserResponseDto.createFromUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        email,
      },
    });
  }

  async create(user: Partial<User>): Promise<User> {
    const createdUser = this.usersRepository.create(user);

    return this.usersRepository.save(createdUser);
  }
}
