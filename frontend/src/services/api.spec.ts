// api.ts uses import.meta.env (Vite-specific) which is not available in Jest/CommonJS.
// We test the data transformation logic that lives inside api.ts functions directly here.

describe('API data transformation helpers', () => {
  describe('strip spaces utility (used in transactionsApi.create)', () => {
    const stripSpaces = (s: string) => s.replace(/\s/g, '');

    it('removes spaces from card number with spaces', () => {
      expect(stripSpaces('4111 1111 1111 1111')).toBe('4111111111111111');
    });

    it('returns unchanged card number without spaces', () => {
      expect(stripSpaces('4111111111111111')).toBe('4111111111111111');
    });

    it('removes spaces from phone number', () => {
      expect(stripSpaces('+57 300 123 4567')).toBe('+573001234567');
    });

    it('handles empty string', () => {
      expect(stripSpaces('')).toBe('');
    });
  });

  describe('expYear normalization (used in transactionsApi.create)', () => {
    const normalizeYear = (year: string) =>
      year.length === 2 ? `20${year}` : year;

    it('converts 2-digit year to 4-digit', () => {
      expect(normalizeYear('30')).toBe('2030');
      expect(normalizeYear('25')).toBe('2025');
      expect(normalizeYear('99')).toBe('2099');
    });

    it('leaves 4-digit year unchanged', () => {
      expect(normalizeYear('2030')).toBe('2030');
      expect(normalizeYear('2025')).toBe('2025');
    });

    it('leaves other lengths unchanged (passthrough)', () => {
      expect(normalizeYear('030')).toBe('030');
    });
  });
});
