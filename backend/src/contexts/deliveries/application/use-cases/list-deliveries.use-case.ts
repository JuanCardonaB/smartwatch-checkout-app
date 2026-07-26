import { Injectable } from '@nestjs/common';
import { Delivery } from '../../domain/delivery.entity';
import { DeliveryRepository } from '../../domain/delivery.repository';

@Injectable()
export class ListDeliveriesUseCase {
  constructor(private readonly repository: DeliveryRepository) {}

  async execute(): Promise<Delivery[]> {
    return this.repository.findAll();
  }
}
