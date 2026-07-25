const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class CustomerEmail {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static from(value: string): CustomerEmail {
    if (!EMAIL_REGEX.test(value)) throw new Error(`Invalid email: ${value}`);
    return new CustomerEmail(value.toLowerCase().trim());
  }
}
