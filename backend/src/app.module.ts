import { Module } from '@nestjs/common';
import { CustomersModule } from './contexts/customers/infrastructure/customers.module';
import { ProductsModule } from './contexts/products/infrastructure/products.module';

@Module({
  imports: [CustomersModule, ProductsModule],
})
export class AppModule {}
