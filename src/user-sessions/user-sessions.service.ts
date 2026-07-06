import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, timingSafeEqual } from 'crypto';
import { EntityManager, Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { UserSession } from './entities/user-session.entity';

@Injectable()
export class UserSessionsService {
  constructor(
    @InjectRepository(UserSession)
    private readonly userSessionsRepository: Repository<UserSession>,
  ) {}

  async createSession(
    user: User,
    refreshToken: string,
    expiredAt: Date,
    manager?: EntityManager,
  ): Promise<UserSession> {
    const repository = this.getRepository(manager);
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const session = repository.create({
      user,
      userId: user.id,
      refreshTokenHash,
      expiredAt,
    });

    return repository.save(session);
  }

  async findValidSessionByUserIdAndRefreshToken(
    userId: number,
    refreshToken: string,
    manager?: EntityManager,
    lockSession = false,
  ): Promise<UserSession | null> {
    if (!Number.isInteger(userId)) {
      return null;
    }

    const queryBuilder = this.getRepository(manager)
      .createQueryBuilder('session')
      .where('session.userId = :userId', { userId })
      .andWhere('session.expiredAt > :now', { now: new Date() });

    if (lockSession) {
      queryBuilder.setLock('pessimistic_write');
    }

    const sessions = await queryBuilder.getMany();
    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    for (const session of sessions) {
      const isMatched = this.isSameHash(
        refreshTokenHash,
        session.refreshTokenHash,
      );

      if (isMatched) {
        return session;
      }
    }

    return null;
  }

  async deleteSessionById(
    sessionId: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<void> {
    if (!Number.isInteger(sessionId) || !Number.isInteger(userId)) {
      return;
    }

    await this.getRepository(manager)
      .createQueryBuilder()
      .delete()
      .from(UserSession)
      .where('id = :sessionId', { sessionId })
      .andWhere('userId = :userId', { userId })
      .execute();
  }

  private getRepository(manager?: EntityManager): Repository<UserSession> {
    return manager?.getRepository(UserSession) ?? this.userSessionsRepository;
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private isSameHash(hash: string, storedHash: string): boolean {
    const hashBuffer = Buffer.from(hash);
    const storedHashBuffer = Buffer.from(storedHash);

    return (
      hashBuffer.length === storedHashBuffer.length &&
      timingSafeEqual(hashBuffer, storedHashBuffer)
    );
  }
}
