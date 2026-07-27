import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetProductUseCase } from '../application/use-cases/get-product.use-case';
import { ListProductsUseCase } from '../application/use-cases/list-products.use-case';
import { UpdateProductUseCase } from '../application/use-cases/update-product.use-case';
import { UpdateStockUseCase } from '../application/use-cases/update-stock.use-case';
import { ProductRepository } from '../domain/product.repository';
import { ProductsController } from './controllers/products.controller';
import { ProductOrmEntity } from './entities/product.orm-entity';
import { TypeOrmProductRepository } from './repositories/typeorm-product.repository';
import { ProductsSeed } from './seed/products.seed';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity])],
  controllers: [ProductsController],
  providers: [
    GetProductUseCase,
    ListProductsUseCase,
    UpdateProductUseCase,
    UpdateStockUseCase,
    ProductsSeed,
    { provide: ProductRepository, useClass: TypeOrmProductRepository },
  ],
  exports: [ProductRepository, UpdateStockUseCase],
})
export class ProductsModule {}
