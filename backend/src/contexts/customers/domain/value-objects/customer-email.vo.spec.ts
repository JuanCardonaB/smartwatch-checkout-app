import { CustomerEmail } from './customer-email.vo';

describe('CustomerEmail', () => {
  it('creates a valid email', () => {
    const email = CustomerEmail.from('Juan@Example.COM');
    expect(email.value).toBe('juan@example.com');
  });

  it('lowercases and trims the value', () => {
    const email = CustomerEmail.from('  USER@DOMAIN.COM  ');
    expect(email.value).toBe('user@domain.com');
  });

  it.each([
    'not-an-email',
    'missing@',
    '@missing.com',
    'no-at-sign',
    '',
  ])('throws for invalid email "%s"', (input) => {
    expect(() => CustomerEmail.from(input)).toThrow();
  });
});
