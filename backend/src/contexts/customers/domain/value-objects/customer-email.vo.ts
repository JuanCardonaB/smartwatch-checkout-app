const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class CustomerEmail {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static from(value: string): CustomerEmail {
    const trimmed = value?.trim() ?? '';
    if (!EMAIL_REGEX.test(trimmed)) throw new Error(`Invalid email: ${value}`);
    return new CustomerEmail(trimmed.toLowerCase());
  }
}
