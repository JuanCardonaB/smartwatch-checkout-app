import { Module } from '@nestjs/common';
import { CustomersModule } from './contexts/customers/infrastructure/customers.module';
import { DeliveriesModule } from './contexts/deliveries/infrastructure/deliveries.module';
import { ProductsModule } from './contexts/products/infrastructure/products.module';
import { TransactionsModule } from './contexts/transactions/infrastructure/transactions.module';

@Module({
  imports: [CustomersModule, DeliveriesModule, ProductsModule, TransactionsModule],
})
export class AppModule {}
