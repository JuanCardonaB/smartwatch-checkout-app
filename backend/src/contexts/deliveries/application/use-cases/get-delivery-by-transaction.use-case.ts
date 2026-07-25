import { Injectable } from '@nestjs/common';
import { Delivery } from '../../domain/delivery.entity';
import { DeliveryRepository } from '../../domain/delivery.repository';
import { Result, ok, err } from '../../../../shared/result';

@Injectable()
export class GetDeliveryByTransactionUseCase {
  constructor(private readonly repository: DeliveryRepository) {}

  async execute(transactionId: string): Promise<Result<Delivery>> {
    const delivery = await this.repository.findByTransactionId(transactionId);
    if (!delivery) return err('Delivery not found for this transaction');
    return ok(delivery);
  }
}
