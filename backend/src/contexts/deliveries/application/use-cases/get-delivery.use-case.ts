import { Injectable } from '@nestjs/common';
import { Delivery } from '../../domain/delivery.entity';
import { DeliveryRepository } from '../../domain/delivery.repository';
import { Result, ok, err } from '../../../../shared/result';

@Injectable()
export class GetDeliveryUseCase {
  constructor(private readonly repository: DeliveryRepository) {}

  async execute(id: string): Promise<Result<Delivery>> {
    const delivery = await this.repository.findById(id);
    if (!delivery) return err('Delivery not found');
    return ok(delivery);
  }
}
