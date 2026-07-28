import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  Attachment,
  AttachmentObjectType,
} from '../entities/attachment.entity';

export class AttachmentResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'milk-tea.jpg' })
  filename!: string;

  @ApiProperty({
    example: 'uploads/products/550e8400-e29b-41d4-a716-446655440000.jpg',
  })
  path!: string;

  @ApiProperty({
    example:
      'https://api.example.com/uploads/products/550e8400-e29b-41d4-a716-446655440000.jpg',
  })
  url!: string;

  @ApiProperty({ example: 'image/jpeg' })
  contentType!: string;

  @ApiProperty({ example: 102400 })
  size!: number;

  @ApiProperty({
    enum: AttachmentObjectType,
    example: AttachmentObjectType.Product,
  })
  objectType!: AttachmentObjectType;

  @ApiProperty({ example: 1 })
  objectId!: number;

  @ApiPropertyOptional({ example: { alt: 'Trà sữa trân châu' } })
  metadata?: Record<string, unknown>;

  @ApiProperty({ example: '2026-07-02T09:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-07-02T09:00:00.000Z' })
  updatedAt!: Date;

  static createFromAttachment(attachment: Attachment): AttachmentResponseDto {
    const dto = new AttachmentResponseDto();

    dto.id = attachment.id;
    dto.filename = attachment.filename;
    dto.path = attachment.path;
    dto.url = attachment.url;
    dto.contentType = attachment.contentType;
    dto.size = attachment.size;
    dto.objectType = attachment.objectType;
    dto.objectId = attachment.objectId;
    dto.metadata = attachment.metadata;
    dto.createdAt = attachment.createdAt;
    dto.updatedAt = attachment.updatedAt;

    return dto;
  }
}
