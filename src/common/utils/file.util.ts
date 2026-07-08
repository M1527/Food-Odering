import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  PayloadTooLargeException,
  Type,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  MulterField,
  MulterOptions,
} from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { I18nContext, I18nService, TranslateOptions } from 'nestjs-i18n';
import { extname } from 'path';
import { Observable } from 'rxjs';

const INVALID_FILE_TYPE_KEY = 'attachments.errors.invalidFileType';
const FILE_TOO_LARGE_KEY = 'attachments.errors.fileTooLarge';

interface I18nRequest extends Request {
  i18nContext?: I18nContext;
  i18nLang?: string;
  i18nService?: I18nService;
}

export interface FileUploadOptions {
  destination: string;
  maxSize?: number;
  mimeTypes?: string[];
  invalidFileTypeMessageKey?: string;
  fileTooLargeMessageKey?: string;
}

export function createFileFieldsInterceptor(
  uploadFields: MulterField[],
  options: FileUploadOptions,
): Type<NestInterceptor> {
  const BaseInterceptor = FileFieldsInterceptor(
    uploadFields,
    createMulterOptions(options),
  );

  class LocalizedFileFieldsInterceptor
    extends BaseInterceptor
    implements NestInterceptor
  {
    async intercept(
      context: ExecutionContext,
      next: CallHandler<unknown>,
    ): Promise<Observable<unknown>> {
      try {
        return await super.intercept(context, next);
      } catch (error) {
        throw localizeUploadException(error, context, options);
      }
    }
  }

  return LocalizedFileFieldsInterceptor;
}

function createMulterOptions(options: FileUploadOptions): MulterOptions {
  const fileFilter: MulterOptions['fileFilter'] = (req, file, callback) => {
    const request = req as I18nRequest;

    if (!isAllowedMimeType(file.mimetype, options.mimeTypes)) {
      callback(
        new BadRequestException(
          translate(request, {
            key: options.invalidFileTypeMessageKey ?? INVALID_FILE_TYPE_KEY,
            fallback: 'Invalid file type',
            args: {
              types: formatMimeTypes(options.mimeTypes),
            },
          }),
        ),
        false,
      );
      return;
    }

    callback(null, true);
  };

  return {
    storage: diskStorage({
      destination: options.destination,
      filename: (_req, file, callback) => {
        callback(null, `${randomUUID()}${extname(file.originalname)}`);
      },
    }),
    fileFilter,
    limits: options.maxSize
      ? {
          fileSize: options.maxSize,
        }
      : undefined,
  };
}

function localizeUploadException(
  error: unknown,
  context: ExecutionContext,
  options: FileUploadOptions,
): unknown {
  if (!(error instanceof PayloadTooLargeException) || !options.maxSize) {
    return error;
  }

  const request = context.switchToHttp().getRequest<I18nRequest>();

  return new PayloadTooLargeException(
    translate(request, {
      key: options.fileTooLargeMessageKey ?? FILE_TOO_LARGE_KEY,
      fallback: 'File size is too large',
      args: {
        maxSize: formatFileSize(options.maxSize),
      },
    }),
  );
}

function isAllowedMimeType(
  mimetype: string,
  mimeTypes: string[] = [],
): boolean {
  if (!mimeTypes.length) {
    return true;
  }

  return mimeTypes.some((mimeType) => {
    if (mimeType.endsWith('/*')) {
      return mimetype.startsWith(mimeType.slice(0, -1));
    }

    if (mimeType.endsWith('/')) {
      return mimetype.startsWith(mimeType);
    }

    return mimetype === mimeType;
  });
}

function translate(
  request: I18nRequest,
  options: {
    key: string;
    fallback: string;
    args?: Record<string, unknown>;
  },
): string {
  const translateOptions: TranslateOptions | undefined = options.args
    ? {
        args: options.args,
      }
    : undefined;
  const context = request.i18nContext ?? I18nContext.current();

  if (context) {
    return context.t(options.key, translateOptions);
  }

  if (request.i18nService) {
    return request.i18nService.t(options.key, {
      ...translateOptions,
      lang: request.i18nLang,
    });
  }

  return options.fallback;
}

function formatMimeTypes(mimeTypes: string[] = []): string {
  return mimeTypes.length ? mimeTypes.join(', ') : 'allowed';
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${bytes / 1024 / 1024}MB`;
  }

  if (bytes >= 1024) {
    return `${bytes / 1024}KB`;
  }

  return `${bytes}B`;
}
