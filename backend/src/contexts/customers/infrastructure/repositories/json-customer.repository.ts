import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Customer } from '../../domain/customer.entity';
import { CustomerRepository } from '../../domain/customer.repository';

const DATA_PATH = path.join(process.cwd(), 'data', 'customers.json');

@Injectable()
export class JsonCustomerRepository implements CustomerRepository {
  private read(): Customer[] {
    if (!fs.existsSync(DATA_PATH)) return [];
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      createdAt: string;
    }>;
    return parsed.map(
      (c) => new Customer(c.id, c.name, c.email, c.phone, new Date(c.createdAt)),
    );
  }

  private write(customers: Customer[]): void {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(customers, null, 2), 'utf-8');
  }

  async findById(id: string): Promise<Customer | null> {
    return this.read().find((c) => c.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.read().find((c) => c.email === email) ?? null;
  }

  async save(customer: Customer): Promise<Customer> {
    const customers = this.read();
    customers.push(customer);
    this.write(customers);
    return customer;
  }
}
