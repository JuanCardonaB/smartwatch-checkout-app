import { Delivery } from './delivery.entity';

export abstract class DeliveryRepository {
  abstract findAll(): Promise<Delivery[]>;
  abstract findById(id: string): Promise<Delivery | null>;
  abstract findByTransactionId(transactionId: string): Promise<Delivery | null>;
  abstract save(delivery: Delivery): Promise<Delivery>;
}
