import { randomUUID } from 'crypto';

export class CustomerId {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static generate(): CustomerId {
    return new CustomerId(randomUUID());
  }

  static from(value: string): CustomerId {
    if (!value?.trim()) throw new Error('CustomerId cannot be empty');
    return new CustomerId(value);
  }
}
