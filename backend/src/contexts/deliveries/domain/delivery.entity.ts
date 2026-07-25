import { DeliveryStatus } from './delivery-status.enum';

export class Delivery {
  constructor(
    public readonly id: string,
    public readonly transactionId: string,
    public readonly customerId: string,
    public readonly recipientName: string,
    public readonly phone: string,
    public readonly address: string,
    public readonly city: string,
    public readonly department: string,
    public readonly status: DeliveryStatus,
    public readonly createdAt: Date,
  ) {}

  withStatus(newStatus: DeliveryStatus): Delivery {
    return new Delivery(
      this.id,
      this.transactionId,
      this.customerId,
      this.recipientName,
      this.phone,
      this.address,
      this.city,
      this.department,
      newStatus,
      this.createdAt,
    );
  }
}
