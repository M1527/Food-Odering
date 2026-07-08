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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { createFileFieldsInterceptor } from '../common/utils/file.util';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

const ProductImagesInterceptor = createFileFieldsInterceptor(
  [
    {
      name: 'images',
      maxCount: 10,
    },
  ],
  {
    destination: 'uploads/products',
    maxSize: 5 * 1024 * 1024,
    mimeTypes: ['image/*'],
  },
);

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
  @UseInterceptors(ProductImagesInterceptor)
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
    },
  ) {
    return this.productsService.create(createProductDto, files.images ?? []);
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
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
  @UseInterceptors(ProductImagesInterceptor)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles()
    files?: {
      images?: Express.Multer.File[];
    },
  ) {
    return this.productsService.update(id, updateProductDto, files?.images);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('admin/products/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
