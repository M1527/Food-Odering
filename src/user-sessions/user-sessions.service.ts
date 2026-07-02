import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { UserSession } from './entities/user-session.entity';

@Injectable()
export class UserSessionsService {
  constructor(
    @InjectRepository(UserSession)
    private readonly userSessionsRepository: Repository<UserSession>,
  ) {}

  async createPendingSession(user: User): Promise<UserSession> {
    const session = this.userSessionsRepository.create({
      user,
      userId: user.id,
      refreshTokenHash: 'PENDING',
      expiredAt: new Date(),
    });

    return this.userSessionsRepository.save(session);
  }

  async updateRefreshToken(
    sessionId: number,
    refreshToken: string,
    expiredAt: Date,
  ): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.userSessionsRepository.update(sessionId, {
      refreshTokenHash,
      expiredAt,
    });
  }

  async findValidSessionByIdAndRefreshToken(
    sessionId: number,
    userId: number,
    refreshToken: string,
  ): Promise<UserSession | null> {
    if (!Number.isInteger(sessionId) || !Number.isInteger(userId)) {
      return null;
    }

    const session = await this.userSessionsRepository
      .createQueryBuilder('session')
      .where('session.id = :sessionId', { sessionId })
      .andWhere('session.userId = :userId', { userId })
      .andWhere('session.expiredAt > :now', { now: new Date() })
      .getOne();

    if (!session) {
      return null;
    }

    const isMatched = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash,
    );

    if (!isMatched) {
      return null;
    }

    return session;
  }

  async deleteSessionById(
    sessionId: number,
    userId: number,
  ): Promise<void> {
    if (!Number.isInteger(sessionId) || !Number.isInteger(userId)) {
      return;
    }

    await this.userSessionsRepository
      .createQueryBuilder()
      .delete()
      .from(UserSession)
      .where('id = :sessionId', { sessionId })
      .andWhere('userId = :userId', { userId })
      .execute();
  }
}