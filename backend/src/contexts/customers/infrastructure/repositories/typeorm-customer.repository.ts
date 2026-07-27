import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../domain/customer.entity';
import { CustomerRepository } from '../../domain/customer.repository';
import { CustomerOrmEntity } from '../entities/customer.orm-entity';

@Injectable()
export class TypeOrmCustomerRepository implements CustomerRepository {
  constructor(
    @InjectRepository(CustomerOrmEntity)
    private readonly repo: Repository<CustomerOrmEntity>,
  ) {}

  private toDomain(e: CustomerOrmEntity): Customer {
    return new Customer(e.id, e.name, e.email, e.phone, e.createdAt);
  }

  async findAll(): Promise<Customer[]> {
    const rows = await this.repo.find({ order: { createdAt: 'DESC' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<Customer | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const row = await this.repo.findOneBy({ email });
    return row ? this.toDomain(row) : null;
  }

  async save(customer: Customer): Promise<Customer> {
    await this.repo.save({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
    });
    return customer;
  }

  async update(customer: Customer): Promise<Customer> {
    await this.repo.update(customer.id, {
      name: customer.name,
      phone: customer.phone,
    });
    return customer;
  }
}
