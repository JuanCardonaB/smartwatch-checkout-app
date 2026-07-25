import { randomUUID } from 'crypto';

export class DeliveryId {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static generate(): DeliveryId {
    return new DeliveryId(randomUUID());
  }

  static from(value: string): DeliveryId {
    if (!value?.trim()) throw new Error('DeliveryId cannot be empty');
    return new DeliveryId(value);
  }
}
