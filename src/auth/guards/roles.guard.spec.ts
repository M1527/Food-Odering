import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../../users/entities/user.entity';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let reflector: {
    getAllAndOverride: jest.Mock;
  };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new RolesGuard(reflector as Reflector);
  });

  it('should allow requests when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('should allow users with required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.Admin]);

    expect(guard.canActivate(createContext({ role: UserRole.Admin }))).toBe(
      true,
    );
  });

  it('should reject users without required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.Admin]);

    expect(() =>
      guard.canActivate(createContext({ role: UserRole.User })),
    ).toThrow(ForbiddenException);
  });
});

function createContext(user?: { role: UserRole }): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user,
      }),
    }),
  } as unknown as ExecutionContext;
}
