import { TransactionStatus } from './transaction-status.enum';

export class Transaction {
  constructor(
    public readonly id: string,
    public readonly wompiId: string | null,
    public readonly reference: string,
    public readonly customerId: string,
    public readonly productId: string,
    public readonly productAmountInCents: number,
    public readonly baseFeeInCents: number,
    public readonly deliveryFeeInCents: number,
    public readonly amountInCents: number,
    public readonly status: TransactionStatus,
    public readonly cardLastFour: string | null,
    public readonly cardBrand: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  withWompiResult(
    wompiId: string,
    status: TransactionStatus,
    cardLastFour: string,
    cardBrand: string,
  ): Transaction {
    return new Transaction(
      this.id,
      wompiId,
      this.reference,
      this.customerId,
      this.productId,
      this.productAmountInCents,
      this.baseFeeInCents,
      this.deliveryFeeInCents,
      this.amountInCents,
      status,
      cardLastFour,
      cardBrand,
      this.createdAt,
      new Date(),
    );
  }
}
