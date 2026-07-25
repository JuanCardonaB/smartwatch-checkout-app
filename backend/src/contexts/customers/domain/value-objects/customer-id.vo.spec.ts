import { CustomerId } from './customer-id.vo';

describe('CustomerId', () => {
  it('generates a valid UUID', () => {
    const id = CustomerId.generate();
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('generates unique values each time', () => {
    const a = CustomerId.generate();
    const b = CustomerId.generate();
    expect(a.value).not.toBe(b.value);
  });

  it('creates from a valid string', () => {
    const id = CustomerId.from('abc-123');
    expect(id.value).toBe('abc-123');
  });

  it.each(['', '   ', null as unknown as string])(
    'throws for empty or invalid value "%s"',
    (input) => {
      expect(() => CustomerId.from(input)).toThrow();
    },
  );
});
