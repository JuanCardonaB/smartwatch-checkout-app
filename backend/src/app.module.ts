import { Module } from '@nestjs/common';
import { CustomersModule } from './contexts/customers/infrastructure/customers.module';
import { DeliveriesModule } from './contexts/deliveries/infrastructure/deliveries.module';
import { ProductsModule } from './contexts/products/infrastructure/products.module';

@Module({
  imports: [CustomersModule, DeliveriesModule, ProductsModule],
})
export class AppModule {}
