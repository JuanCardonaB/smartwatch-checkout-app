import { Module } from '@nestjs/common';
import { GetProductUseCase } from '../application/use-cases/get-product.use-case';
import { ListProductsUseCase } from '../application/use-cases/list-products.use-case';
import { UpdateProductUseCase } from '../application/use-cases/update-product.use-case';
import { UpdateStockUseCase } from '../application/use-cases/update-stock.use-case';
import { ProductRepository } from '../domain/product.repository';
import { ProductsController } from './controllers/products.controller';
import { JsonProductRepository } from './repositories/json-product.repository';
import { ProductsSeed } from './seed/products.seed';

@Module({
  controllers: [ProductsController],
  providers: [
    GetProductUseCase,
    ListProductsUseCase,
    UpdateProductUseCase,
    UpdateStockUseCase,
    ProductsSeed,
    { provide: ProductRepository, useClass: JsonProductRepository },
  ],
  exports: [ProductRepository, UpdateStockUseCase],
})
export class ProductsModule {}
