import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { Profile } from './entities/profile.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
  ) {}

  async createDefaultProfile(user: User): Promise<Profile> {
    const profile = this.profilesRepository.create({
      user,
      userId: user.id,
    });

    return this.profilesRepository.save(profile);
  }
}