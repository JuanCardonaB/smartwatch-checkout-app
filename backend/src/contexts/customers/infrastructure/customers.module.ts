import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateCustomerUseCase } from '../application/use-cases/create-customer.use-case';
import { GetCustomerUseCase } from '../application/use-cases/get-customer.use-case';
import { ListCustomersUseCase } from '../application/use-cases/list-customers.use-case';
import { UpsertCustomerUseCase } from '../application/use-cases/upsert-customer.use-case';
import { CustomerRepository } from '../domain/customer.repository';
import { CustomersController } from './controllers/customers.controller';
import { CustomerOrmEntity } from './entities/customer.orm-entity';
import { TypeOrmCustomerRepository } from './repositories/typeorm-customer.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerOrmEntity])],
  controllers: [CustomersController],
  providers: [
    CreateCustomerUseCase,
    GetCustomerUseCase,
    ListCustomersUseCase,
    UpsertCustomerUseCase,
    { provide: CustomerRepository, useClass: TypeOrmCustomerRepository },
  ],
  exports: [CustomerRepository, UpsertCustomerUseCase],
})
export class CustomersModule {}
