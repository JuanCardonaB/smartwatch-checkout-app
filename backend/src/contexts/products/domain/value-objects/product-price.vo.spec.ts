import { ProductPrice } from './product-price.vo';

describe('ProductPrice', () => {
  it('creates a valid price', () => {
    const price = ProductPrice.from(29900000);
    expect(price.value).toBe(29900000);
  });

  it.each([0, -1, -100])(
    'throws for non-positive value %d',
    (input) => {
      expect(() => ProductPrice.from(input)).toThrow();
    },
  );

  it.each([1.5, 10.99])(
    'throws for non-integer value %d',
    (input) => {
      expect(() => ProductPrice.from(input)).toThrow();
    },
  );
});
