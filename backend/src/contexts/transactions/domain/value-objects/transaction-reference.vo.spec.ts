import { TransactionReference } from './transaction-reference.vo';

describe('TransactionReference', () => {
  it('generates a reference with SW- prefix', () => {
    const ref = TransactionReference.generate();
    expect(ref.value).toMatch(/^SW-/);
  });

  it('generates a reference with a UUID after the prefix', () => {
    const ref = TransactionReference.generate();
    const uuid = ref.value.replace('SW-', '');
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('produces unique values each call', () => {
    const a = TransactionReference.generate();
    const b = TransactionReference.generate();
    expect(a.value).not.toBe(b.value);
  });
});
