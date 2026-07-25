import { Injectable } from '@nestjs/common';
import { Customer } from '../../domain/customer.entity';
import { CustomerRepository } from '../../domain/customer.repository';
import { CustomerId } from '../../domain/value-objects/customer-id.vo';
import { CustomerEmail } from '../../domain/value-objects/customer-email.vo';
import { Result, ok, err } from '../../../../shared/result';

export interface UpsertCustomerCommand {
  name: string;
  email: string;
  phone: string;
}

@Injectable()
export class UpsertCustomerUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(command: UpsertCustomerCommand): Promise<Result<Customer>> {
    let email: CustomerEmail;
    try {
      email = CustomerEmail.from(command.email);
    } catch {
      return err('Invalid email format');
    }

    const existing = await this.repository.findByEmail(email.value);

    if (existing) {
      const updated = existing.withUpdatedInfo(command.name.trim(), command.phone.trim());
      const saved = await this.repository.update(updated);
      return ok(saved);
    }

    const customer = new Customer(
      CustomerId.generate().value,
      command.name.trim(),
      email.value,
      command.phone.trim(),
      new Date(),
    );

    const saved = await this.repository.save(customer);
    return ok(saved);
  }
}
