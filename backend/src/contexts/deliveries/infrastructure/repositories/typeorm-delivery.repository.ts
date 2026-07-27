import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../../domain/delivery.entity';
import { DeliveryRepository } from '../../domain/delivery.repository';
import { DeliveryOrmEntity } from '../entities/delivery.orm-entity';

@Injectable()
export class TypeOrmDeliveryRepository implements DeliveryRepository {
  constructor(
    @InjectRepository(DeliveryOrmEntity)
    private readonly repo: Repository<DeliveryOrmEntity>,
  ) {}

  private toDomain(e: DeliveryOrmEntity): Delivery {
    return new Delivery(
      e.id,
      e.transactionId,
      e.customerId,
      e.recipientName,
      e.phone,
      e.address,
      e.city,
      e.department,
      e.status,
      e.createdAt,
    );
  }

  async findAll(): Promise<Delivery[]> {
    const rows = await this.repo.find({ order: { createdAt: 'DESC' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<Delivery | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? this.toDomain(row) : null;
  }

  async findByTransactionId(transactionId: string): Promise<Delivery | null> {
    const row = await this.repo.findOneBy({ transactionId });
    return row ? this.toDomain(row) : null;
  }

  async save(delivery: Delivery): Promise<Delivery> {
    await this.repo.save({
      id: delivery.id,
      transactionId: delivery.transactionId,
      customerId: delivery.customerId,
      recipientName: delivery.recipientName,
      phone: delivery.phone,
      address: delivery.address,
      city: delivery.city,
      department: delivery.department,
      status: delivery.status,
    });
    return delivery;
  }
}
