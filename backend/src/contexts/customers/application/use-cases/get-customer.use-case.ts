import { Injectable } from '@nestjs/common';
import { Customer } from '../../domain/customer.entity';
import { CustomerRepository } from '../../domain/customer.repository';
import { Result, ok, err } from '../../../../shared/result';

@Injectable()
export class GetCustomerUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(id: string): Promise<Result<Customer>> {
    const customer = await this.repository.findById(id);
    if (!customer) return err('Customer not found');
    return ok(customer);
  }
}
