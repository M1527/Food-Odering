import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('admin/products')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['categoryId', 'name', 'description', 'price', 'stock'],
      properties: {
        categoryId: {
          type: 'number',
          example: 1,
        },
        name: {
          type: 'string',
          example: 'Milk tea with pearl',
        },
        description: {
          type: 'string',
          example: 'Traditional milk tea with black pearls',
        },
        price: {
          type: 'string',
          example: '35000',
        },
        stock: {
          type: 'number',
          example: 100,
        },
        isFeatured: {
          type: 'boolean',
          example: true,
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'INACTIVE'],
          example: 'ACTIVE',
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'images',
          maxCount: 10,
        },
      ],
      {
        storage: diskStorage({
          destination: 'uploads/products',
          filename: (_req, file, callback) => {
            const fileExtension = extname(file.originalname);
            const encryptedFilename = `${randomUUID()}${fileExtension}`;

            callback(null, encryptedFilename);
          },
        }),
        fileFilter: (_req, file, callback) => {
          if (!file.mimetype.startsWith('image/')) {
            callback(new Error('Only image files are allowed'), false);
            return;
          }

          callback(null, true);
        },
        limits: {
          fileSize: 5 * 1024 * 1024,
        },
      },
    ),
  )
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
    },
  ) {
    return this.productsService.create(
      createProductDto,
      files.images ?? [],
    );
  }

  @Get('products')
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get('products/featured')
  findFeatured() {
    return this.productsService.findFeatured();
  }

  @Get('products/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('admin/products/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('admin/products/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
