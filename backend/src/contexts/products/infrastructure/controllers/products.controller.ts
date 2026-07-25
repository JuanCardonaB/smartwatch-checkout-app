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
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiCreatedResponse({ type: ProductResponseDto })
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    const result = await this.createProduct.execute(dto);
    if (!result.ok) throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
    return ProductResponseDto.fromEntity(result.value);
  }

  @Get()
  @ApiOkResponse({ type: [ProductResponseDto] })
  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.listProducts.execute();
    return products.map(ProductResponseDto.fromEntity);
  }

  @Get(':id')
  @ApiOkResponse({ type: ProductResponseDto })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    const result = await this.getProduct.execute(id);
    if (!result.ok) throw new HttpException(result.error, HttpStatus.NOT_FOUND);
    return ProductResponseDto.fromEntity(result.value);
  }

  @Patch(':id/stock')
  @ApiOkResponse({ type: ProductResponseDto })
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
