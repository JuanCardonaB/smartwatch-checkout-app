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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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
import { ALLOWED_IMAGE_MIME, MAX_UPLOAD_BYTES } from '../uploads.config';
import { CloudinaryService } from '../cloudinary.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly updateStock: UpdateStockUseCase,
    private readonly cloudinary: CloudinaryService,
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
      storage: memoryStorage(),
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
    description: 'Uploads one or more image files to Cloudinary and returns their public URLs.',
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
  @ApiOkResponse({ description: 'Uploaded image URLs', schema: { example: { urls: ['https://res.cloudinary.com/demo/image/upload/products/uuid.png'] } } })
  @ApiBadRequestResponse({ description: 'No files or invalid file type' })
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files were uploaded');
    }
    const results = await Promise.all(
      files.map((file) => this.cloudinary.uploadBuffer(file.buffer)),
    );
    return { urls: results.map((r) => r.secure_url) };
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
