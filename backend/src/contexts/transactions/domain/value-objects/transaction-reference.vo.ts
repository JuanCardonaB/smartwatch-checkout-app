import { randomUUID } from 'crypto';

export class TransactionReference {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  // Format: SW-{uuid} — identifiable in Wompi dashboard
  static generate(): TransactionReference {
    return new TransactionReference(`SW-${randomUUID()}`);
  }
}
