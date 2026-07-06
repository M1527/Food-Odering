import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';

import { ProductsService } from '../products/products.service';
import { AttachmentResponseDto } from './dto/attachment-response.dto';
import {
  Attachment,
  AttachmentObjectType,
} from './entities/attachment.entity';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: Repository<Attachment>,

    private readonly productsService: ProductsService,
    private readonly i18n: I18nService,
  ) {}

  async uploadProductAttachment(
    productId: number,
    file: Express.Multer.File,
  ) {
    await this.productsService.getProductOrThrow(productId);

    if (!file) {
      throw new BadRequestException(
        this.translate('attachments.errors.fileRequired'),
      );
    }

    const normalizedPath = file.path.replace(/\\/g, '/');

    const attachment = this.attachmentsRepository.create({
      filename: file.originalname,
      path: normalizedPath,
      url: `http://localhost:3000/${normalizedPath}`,
      contentType: file.mimetype,
      size: file.size,
      objectType: AttachmentObjectType.Product,
      objectId: productId,
    });

    try {
      const savedAttachment =
        await this.attachmentsRepository.save(attachment);

      return {
        message: this.translate('attachments.messages.uploaded'),
        attachment:
          AttachmentResponseDto.createFromAttachment(savedAttachment),
      };
    } catch (error) {
      throw error;
    }
  }

  async findProductAttachments(productId: number) {
    await this.productsService.getProductOrThrow(productId);

    const attachments = await this.attachmentsRepository.find({
      where: {
        objectType: AttachmentObjectType.Product,
        objectId: productId,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      attachments: attachments.map((attachment) =>
        AttachmentResponseDto.createFromAttachment(attachment),
      ),
      total: attachments.length,
    };
  }

  private translate(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang });
  }
}