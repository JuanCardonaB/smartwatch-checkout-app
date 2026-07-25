import { DeliveryId } from './delivery-id.vo';

describe('DeliveryId', () => {
  it('generates a valid UUID', () => {
    const id = DeliveryId.generate();
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('generates unique values each call', () => {
    expect(DeliveryId.generate().value).not.toBe(DeliveryId.generate().value);
  });

  it('creates from a valid string', () => {
    const id = DeliveryId.from('some-delivery-id');
    expect(id.value).toBe('some-delivery-id');
  });

  it.each(['', '   ', null as unknown as string])(
    'throws for empty or null value',
    (input) => {
      expect(() => DeliveryId.from(input)).toThrow();
    },
  );
});
