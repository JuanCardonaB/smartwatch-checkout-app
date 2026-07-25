import { ProductId } from './product-id.vo';

describe('ProductId', () => {
  it('generates a valid UUID', () => {
    const id = ProductId.generate();
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('generates unique values each call', () => {
    expect(ProductId.generate().value).not.toBe(ProductId.generate().value);
  });

  it('creates from a valid string', () => {
    const id = ProductId.from('some-id');
    expect(id.value).toBe('some-id');
  });

  it.each(['', '   ', null as unknown as string])(
    'throws for empty or null value',
    (input) => {
      expect(() => ProductId.from(input)).toThrow();
    },
  );
});
