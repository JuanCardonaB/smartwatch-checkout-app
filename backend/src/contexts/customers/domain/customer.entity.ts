export class Customer {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly createdAt: Date,
  ) {}

  withUpdatedInfo(name: string, phone: string): Customer {
    return new Customer(this.id, name, this.email, phone, this.createdAt);
  }
}
