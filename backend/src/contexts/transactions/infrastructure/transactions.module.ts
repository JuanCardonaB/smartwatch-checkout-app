import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateTransactionUseCase } from '../application/use-cases/create-transaction.use-case';
import { GetTransactionUseCase } from '../application/use-cases/get-transaction.use-case';
import { ListTransactionsUseCase } from '../application/use-cases/list-transactions.use-case';
import { PaymentGatewayPort } from '../application/ports/payment-gateway.port';
import { TransactionRepository } from '../domain/transaction.repository';
import { WompiAdapter } from './adapters/wompi.adapter';
import { TransactionsController } from './controllers/transactions.controller';
import { TransactionOrmEntity } from './entities/transaction.orm-entity';
import { TypeOrmTransactionRepository } from './repositories/typeorm-transaction.repository';
import { CustomersModule } from '../../customers/infrastructure/customers.module';
import { ProductsModule } from '../../products/infrastructure/products.module';
import { DeliveriesModule } from '../../deliveries/infrastructure/deliveries.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionOrmEntity]),
    CustomersModule,
    ProductsModule,
    DeliveriesModule,
  ],
  controllers: [TransactionsController],
  providers: [
    CreateTransactionUseCase,
    GetTransactionUseCase,
    ListTransactionsUseCase,
    { provide: TransactionRepository, useClass: TypeOrmTransactionRepository },
    { provide: PaymentGatewayPort, useClass: WompiAdapter },
  ],
})
export class TransactionsModule {}
