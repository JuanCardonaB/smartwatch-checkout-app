import { randomUUID } from 'crypto';

export class ProductId {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static generate(): ProductId {
    return new ProductId(randomUUID());
  }

  static from(value: string): ProductId {
    if (!value?.trim()) throw new Error('ProductId cannot be empty');
    return new ProductId(value);
  }
}
