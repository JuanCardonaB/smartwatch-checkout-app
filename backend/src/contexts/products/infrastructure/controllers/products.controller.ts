import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { GetProductUseCase } from '../../application/use-cases/get-product.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { UpdateStockUseCase } from '../../application/use-cases/update-stock.use-case';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateStockDto } from '../dtos/update-stock.dto';
import { ProductResponseDto } from '../dtos/product-response.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly updateStock: UpdateStockUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a product', description: 'Creates a new product in the store. Price must be provided in cents (COP).' })
  @ApiCreatedResponse({ type: ProductResponseDto, description: 'Product created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid price or stock value' })
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    const result = await this.createProduct.execute(dto);
    if (!result.ok) throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
    return ProductResponseDto.fromEntity(result.value);
  }

  @Get()
  @ApiOperation({ summary: 'List all products', description: 'Returns all available products with their current stock.' })
  @ApiOkResponse({ type: [ProductResponseDto], description: 'List of products' })
  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.listProducts.execute();
    return products.map(ProductResponseDto.fromEntity);
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
