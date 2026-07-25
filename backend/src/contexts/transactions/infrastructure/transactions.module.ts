import { Module } from '@nestjs/common';
import { CreateTransactionUseCase } from '../application/use-cases/create-transaction.use-case';
import { GetTransactionUseCase } from '../application/use-cases/get-transaction.use-case';
import { PaymentGatewayPort } from '../application/ports/payment-gateway.port';
import { TransactionRepository } from '../domain/transaction.repository';
import { WompiAdapter } from './adapters/wompi.adapter';
import { TransactionsController } from './controllers/transactions.controller';
import { JsonTransactionRepository } from './repositories/json-transaction.repository';
import { CustomersModule } from '../../customers/infrastructure/customers.module';
import { ProductsModule } from '../../products/infrastructure/products.module';
import { DeliveriesModule } from '../../deliveries/infrastructure/deliveries.module';

@Module({
  imports: [CustomersModule, ProductsModule, DeliveriesModule],
  controllers: [TransactionsController],
  providers: [
    CreateTransactionUseCase,
    GetTransactionUseCase,
    { provide: TransactionRepository, useClass: JsonTransactionRepository },
    { provide: PaymentGatewayPort, useClass: WompiAdapter },
  ],
})
export class TransactionsModule {}
