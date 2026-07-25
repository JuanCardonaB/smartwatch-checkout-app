import { Injectable } from '@nestjs/common';
import { Delivery } from '../../domain/delivery.entity';
import { DeliveryRepository } from '../../domain/delivery.repository';
import { DeliveryStatus } from '../../domain/delivery-status.enum';
import { DeliveryId } from '../../domain/value-objects/delivery-id.vo';
import { Result, ok, err } from '../../../../shared/result';

export interface CreateDeliveryCommand {
  transactionId: string;
  customerId: string;
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  department: string;
}

@Injectable()
export class CreateDeliveryUseCase {
  constructor(private readonly repository: DeliveryRepository) {}

  async execute(command: CreateDeliveryCommand): Promise<Result<Delivery>> {
    const existing = await this.repository.findByTransactionId(command.transactionId);
    if (existing) return err('A delivery already exists for this transaction');

    const delivery = new Delivery(
      DeliveryId.generate().value,
      command.transactionId,
      command.customerId,
      command.recipientName.trim(),
      command.phone.trim(),
      command.address.trim(),
      command.city.trim(),
      command.department.trim(),
      DeliveryStatus.PENDING,
      new Date(),
    );

    const saved = await this.repository.save(delivery);
    return ok(saved);
  }
}
