import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Put,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { GetProductUseCase } from '../../application/use-cases/get-product.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { UpdateStockUseCase } from '../../application/use-cases/update-stock.use-case';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { UpdateStockDto } from '../dtos/update-stock.dto';
import { ProductResponseDto } from '../dtos/product-response.dto';
import {
  ALLOWED_IMAGE_MIME,
  MAX_UPLOAD_BYTES,
  UPLOADS_DIR,
  UPLOADS_ROUTE,
} from '../uploads.config';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly updateStock: UpdateStockUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all products', description: 'Returns all available products with their current stock.' })
  @ApiOkResponse({ type: [ProductResponseDto], description: 'List of products' })
  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.listProducts.execute();
    return products.map(ProductResponseDto.fromEntity);
  }

  @Post('images')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIME.test(file.mimetype)) {
          cb(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  @ApiOperation({
    summary: 'Upload product images',
    description: 'Uploads one or more image files and returns their public URLs.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @ApiOkResponse({ description: 'Uploaded image URLs', schema: { example: { urls: ['http://localhost:3000/uploads/uuid.png'] } } })
  @ApiBadRequestResponse({ description: 'No files or invalid file type' })
  uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ): { urls: string[] } {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files were uploaded');
    }
    const base = `${req.protocol}://${req.get('host')}`;
    const urls = files.map((file) => `${base}${UPLOADS_ROUTE}/${file.filename}`);
    return { urls };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID', description: 'Returns a single product with its current stock level.' })
  @ApiParam({ name: 'id', description: 'Product UUID', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @ApiOkResponse({ type: ProductResponseDto, description: 'Product found' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    const result = await this.getProduct.execute(id);
    if (!result.ok) throw new HttpException(result.error, HttpStatus.NOT_FOUND);
    return ProductResponseDto.fromEntity(result.value);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a product',
    description: 'Updates all editable fields of a product. Price must be provided in cents (COP).',
  })
  @ApiParam({ name: 'id', description: 'Product UUID', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @ApiOkResponse({ type: ProductResponseDto, description: 'Product updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid price or stock value' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const result = await this.updateProduct.execute({ id, ...dto });
    if (!result.ok) {
      const status = result.error === 'Product not found' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(result.error, status);
    }
    return ProductResponseDto.fromEntity(result.value);
  }

  @Patch(':id/stock')
  @ApiOperation({
    summary: 'Decrement product stock',
    description: 'Reduces the stock of a product by the specified quantity. Called internally after a successful payment.',
  })
  @ApiParam({ name: 'id', description: 'Product UUID', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @ApiOkResponse({ type: ProductResponseDto, description: 'Stock updated successfully' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiConflictResponse({ description: 'Insufficient stock available' })
  async decrementStock(
    @Param('id') id: string,
    @Body() dto: UpdateStockDto,
  ): Promise<ProductResponseDto> {
    const result = await this.updateStock.execute({ productId: id, quantity: dto.quantity });
    if (!result.ok) {
      const status = result.error.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.CONFLICT;
      throw new HttpException(result.error, status);
    }
    return ProductResponseDto.fromEntity(result.value);
  }
}
