import { randomUUID } from 'crypto';

export class TransactionId {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static generate(): TransactionId {
    return new TransactionId(randomUUID());
  }

  static from(value: string): TransactionId {
    if (!value?.trim()) throw new Error('TransactionId cannot be empty');
    return new TransactionId(value);
  }
}
