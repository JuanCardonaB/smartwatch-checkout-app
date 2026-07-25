import { Transaction } from './transaction.entity';
import { TransactionStatus } from './transaction-status.enum';

const makeTransaction = (overrides: Partial<ConstructorParameters<typeof Transaction>[0]> = {}) =>
  new Transaction(
    'txn-1',
    null,
    'SW-ref-1',
    'cust-1',
    'prod-1',
    29900000,
    300000,
    500000,
    30700000,
    TransactionStatus.PENDING,
    null,
    null,
    new Date('2026-01-01'),
    new Date('2026-01-01'),
  );

describe('Transaction entity', () => {
  it('stores all constructor values', () => {
    const txn = makeTransaction();
    expect(txn.id).toBe('txn-1');
    expect(txn.reference).toBe('SW-ref-1');
    expect(txn.amountInCents).toBe(30700000);
    expect(txn.status).toBe(TransactionStatus.PENDING);
    expect(txn.wompiId).toBeNull();
  });

  describe('withWompiResult', () => {
    it('returns a new Transaction with Wompi data', () => {
      const original = makeTransaction();
      const updated = original.withWompiResult(
        'wompi-123',
        TransactionStatus.APPROVED,
        '1111',
        'VISA',
      );

      expect(updated).not.toBe(original);
      expect(updated.id).toBe(original.id);
      expect(updated.reference).toBe(original.reference);
      expect(updated.wompiId).toBe('wompi-123');
      expect(updated.status).toBe(TransactionStatus.APPROVED);
      expect(updated.cardLastFour).toBe('1111');
      expect(updated.cardBrand).toBe('VISA');
    });

    it('preserves immutable fields from original', () => {
      const original = makeTransaction();
      const updated = original.withWompiResult('w-id', TransactionStatus.DECLINED, '4242', 'MASTERCARD');

      expect(updated.customerId).toBe(original.customerId);
      expect(updated.productId).toBe(original.productId);
      expect(updated.amountInCents).toBe(original.amountInCents);
      expect(updated.createdAt).toBe(original.createdAt);
    });

    it('updates updatedAt to a new Date', () => {
      const original = makeTransaction();
      const before = Date.now();
      const updated = original.withWompiResult('w-id', TransactionStatus.APPROVED, '1111', 'VISA');
      const after = Date.now();

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(updated.updatedAt.getTime()).toBeLessThanOrEqual(after);
    });

    it('marks as ERROR status', () => {
      const original = makeTransaction();
      const updated = original.withWompiResult('', TransactionStatus.ERROR, '', '');
      expect(updated.status).toBe(TransactionStatus.ERROR);
    });
  });
});
