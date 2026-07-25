export class ProductPrice {
  readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static from(value: number): ProductPrice {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error('Price must be a positive integer (in cents)');
    }
    return new ProductPrice(value);
  }
}
