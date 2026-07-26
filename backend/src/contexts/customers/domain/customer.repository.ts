import { Customer } from './customer.entity';

export abstract class CustomerRepository {
  abstract findAll(): Promise<Customer[]>;
  abstract findById(id: string): Promise<Customer | null>;
  abstract findByEmail(email: string): Promise<Customer | null>;
  abstract save(customer: Customer): Promise<Customer>;
  abstract update(customer: Customer): Promise<Customer>;
}
