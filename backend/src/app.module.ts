import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from './contexts/customers/infrastructure/customers.module';
import { DeliveriesModule } from './contexts/deliveries/infrastructure/deliveries.module';
import { ProductsModule } from './contexts/products/infrastructure/products.module';
import { TransactionsModule } from './contexts/transactions/infrastructure/transactions.module';
import { CustomerOrmEntity } from './contexts/customers/infrastructure/entities/customer.orm-entity';
import { ProductOrmEntity } from './contexts/products/infrastructure/entities/product.orm-entity';
import { TransactionOrmEntity } from './contexts/transactions/infrastructure/entities/transaction.orm-entity';
import { DeliveryOrmEntity } from './contexts/deliveries/infrastructure/entities/delivery.orm-entity';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        username: process.env.DB_USER ?? 'smartwatch',
        password: process.env.DB_PASSWORD ?? 'smartwatch',
        database: process.env.DB_NAME ?? 'smartwatch',
        entities: [
          CustomerOrmEntity,
          ProductOrmEntity,
          TransactionOrmEntity,
          DeliveryOrmEntity,
        ],
        synchronize: process.env.NODE_ENV === 'development',
      }),
    }),
    CustomersModule,
    DeliveriesModule,
    ProductsModule,
    TransactionsModule,
  ],
})
export class AppModule {}
