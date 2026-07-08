import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { AttachmentResponseDto } from './dto/attachment-response.dto';
import { Attachment, AttachmentObjectType } from './entities/attachment.entity';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: Repository<Attachment>,
    private readonly configService: ConfigService,
  ) {}

  async createProductAttachments(
    product: Product,
    files: Express.Multer.File[],
    manager: EntityManager,
  ): Promise<Attachment[]> {
    if (!files.length) {
      return [];
    }

    const repository = manager.getRepository(Attachment);
    const appUrl = this.configService
      .getOrThrow<string>('APP_URL')
      .replace(/\/+$/, '');

    const attachments = files.map((file) => {
      const normalizedPath = file.path.replace(/\\/g, '/');

      return repository.create({
        filename: file.originalname,
        path: normalizedPath,
        url: `${appUrl}/${normalizedPath}`,
        contentType: file.mimetype,
        size: file.size,
        objectType: AttachmentObjectType.Product,
        objectId: product.id,
      });
    });

    return repository.save(attachments);
  }

  async findProductAttachments(
    productId: number,
  ): Promise<AttachmentResponseDto[]> {
    const attachments = await this.attachmentsRepository.find({
      where: {
        objectType: AttachmentObjectType.Product,
        objectId: productId,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return attachments.map((attachment) =>
      AttachmentResponseDto.createFromAttachment(attachment),
    );
  }

  async findProductAttachmentsByProductIds(
    productIds: number[],
  ): Promise<Map<number, AttachmentResponseDto[]>> {
    if (!productIds.length) {
      return new Map();
    }

    const attachments = await this.attachmentsRepository
      .createQueryBuilder('attachment')
      .where('attachment.objectType = :objectType', {
        objectType: AttachmentObjectType.Product,
      })
      .andWhere('attachment.objectId IN (:...productIds)', { productIds })
      .orderBy('attachment.createdAt', 'DESC')
      .getMany();

    const map = new Map<number, AttachmentResponseDto[]>();

    for (const attachment of attachments) {
      const dto = AttachmentResponseDto.createFromAttachment(attachment);
      const current = map.get(attachment.objectId) ?? [];

      current.push(dto);
      map.set(attachment.objectId, current);
    }

    return map;
  }

  async softDeleteProductAttachments(
    productId: number,
    manager: EntityManager,
  ): Promise<void> {
    await manager.getRepository(Attachment).softDelete({
      objectType: AttachmentObjectType.Product,
      objectId: productId,
    });
  }
}
