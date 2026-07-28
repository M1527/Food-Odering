import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { User, UserRole } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({
    example: 1,
  })
  id!: number;

  @ApiProperty({
    example: 'user1@example.com',
  })
  email!: string;

  @ApiProperty({
    example: 'User One',
  })
  fullName!: string;

  @ApiPropertyOptional({
    example: '0123456789',
  })
  phone?: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.User,
  })
  role!: UserRole;

  static createFromUser(user: User): UserResponseDto {
    const dto = new UserResponseDto();

    dto.id = user.id;
    dto.email = user.email;
    dto.fullName = user.fullName;
    dto.phone = user.phone;
    dto.role = user.role;

    return dto;
  }
}