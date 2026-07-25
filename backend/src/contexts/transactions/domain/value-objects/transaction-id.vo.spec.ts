import { TransactionId } from './transaction-id.vo';

describe('TransactionId', () => {
  describe('generate', () => {
    it('produces a valid UUID', () => {
      const id = TransactionId.generate();
      expect(id.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('produces unique values each call', () => {
      const a = TransactionId.generate();
      const b = TransactionId.generate();
      expect(a.value).not.toBe(b.value);
    });
  });

  describe('from', () => {
    it('accepts a valid non-empty string', () => {
      const id = TransactionId.from('some-uuid');
      expect(id.value).toBe('some-uuid');
    });

    it('throws for empty string', () => {
      expect(() => TransactionId.from('')).toThrow('TransactionId cannot be empty');
    });

    it('throws for whitespace-only string', () => {
      expect(() => TransactionId.from('   ')).toThrow('TransactionId cannot be empty');
    });
  });
});
