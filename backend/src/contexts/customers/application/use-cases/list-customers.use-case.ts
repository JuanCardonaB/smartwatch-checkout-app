import { Injectable } from '@nestjs/common';
import { Customer } from '../../domain/customer.entity';
import { CustomerRepository } from '../../domain/customer.repository';

@Injectable()
export class ListCustomersUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(): Promise<Customer[]> {
    return this.repository.findAll();
  }
}
