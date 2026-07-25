import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Delivery } from '../../domain/delivery.entity';
import { DeliveryRepository } from '../../domain/delivery.repository';
import { DeliveryStatus } from '../../domain/delivery-status.enum';

const DATA_PATH = path.join(process.cwd(), 'data', 'deliveries.json');

@Injectable()
export class JsonDeliveryRepository implements DeliveryRepository {
  private read(): Delivery[] {
    if (!fs.existsSync(DATA_PATH)) return [];
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Array<{
      id: string;
      transactionId: string;
      customerId: string;
      recipientName: string;
      phone: string;
      address: string;
      city: string;
      department: string;
      status: DeliveryStatus;
      createdAt: string;
    }>;
    return parsed.map(
      (d) =>
        new Delivery(
          d.id,
          d.transactionId,
          d.customerId,
          d.recipientName,
          d.phone,
          d.address,
          d.city,
          d.department,
          d.status,
          new Date(d.createdAt),
        ),
    );
  }

  private write(deliveries: Delivery[]): void {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(deliveries, null, 2), 'utf-8');
  }

  async findById(id: string): Promise<Delivery | null> {
    return this.read().find((d) => d.id === id) ?? null;
  }

  async findByTransactionId(transactionId: string): Promise<Delivery | null> {
    return this.read().find((d) => d.transactionId === transactionId) ?? null;
  }

  async save(delivery: Delivery): Promise<Delivery> {
    const deliveries = this.read();
    deliveries.push(delivery);
    this.write(deliveries);
    return delivery;
  }
}
