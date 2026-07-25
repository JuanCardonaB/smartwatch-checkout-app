export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly priceInCents: number,
    public readonly imageUrl: string,
    public readonly stock: number,
    public readonly createdAt: Date,
  ) {}

  withStock(newStock: number): Product {
    return new Product(
      this.id,
      this.name,
      this.description,
      this.priceInCents,
      this.imageUrl,
      newStock,
      this.createdAt,
    );
  }
}
