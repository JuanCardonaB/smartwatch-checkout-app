import { Module } from '@nestjs/common';
import { ProductsModule } from './contexts/products/infrastructure/products.module';
import { CustomersModule } from './contexts/customers/infrastructure/customers.module';

@Module({
  imports: [ProductsModule, CustomersModule],
})
export class AppModule {}
