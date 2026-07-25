import { Module } from '@nestjs/common';
import { CreateCustomerUseCase } from '../application/use-cases/create-customer.use-case';
import { GetCustomerUseCase } from '../application/use-cases/get-customer.use-case';
import { CustomerRepository } from '../domain/customer.repository';
import { CustomersController } from './controllers/customers.controller';
import { JsonCustomerRepository } from './repositories/json-customer.repository';

@Module({
  controllers: [CustomersController],
  providers: [
    CreateCustomerUseCase,
    GetCustomerUseCase,
    { provide: CustomerRepository, useClass: JsonCustomerRepository },
  ],
  exports: [CustomerRepository],
})
export class CustomersModule {}
