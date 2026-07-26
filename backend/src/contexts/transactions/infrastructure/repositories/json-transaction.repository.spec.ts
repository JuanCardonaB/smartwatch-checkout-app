import * as fs from 'fs';
import { JsonTransactionRepository } from './json-transaction.repository';
import { Transaction } from '../../domain/transaction.entity';
import { TransactionStatus } from '../../domain/transaction-status.enum';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

const DATA_PATH_PATTERN = /transactions\.json$/;

const makeTransaction = (id = 'txn-1', status = TransactionStatus.APPROVED) =>
  new Transaction(
    id,
    'wompi-id',
    `SW-ref-${id}`,
    'cust-1',
    'prod-1',
    29900000,
    300000,
    500000,
    30700000,
    status,
    '1111',
    'VISA',
    new Date('2026-01-01'),
    new Date('2026-01-01'),
  );

const serializeTransactions = (transactions: Transaction[]) =>
  JSON.stringify(
    transactions.map((t) => ({
      id: t.id,
      wompiId: t.wompiId,
      reference: t.reference,
      customerId: t.customerId,
      productId: t.productId,
      productAmountInCents: t.productAmountInCents,
      baseFeeInCents: t.baseFeeInCents,
      deliveryFeeInCents: t.deliveryFeeInCents,
      amountInCents: t.amountInCents,
      status: t.status,
      cardLastFour: t.cardLastFour,
      cardBrand: t.cardBrand,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
    null,
    2,
  );

describe('JsonTransactionRepository', () => {
  let repo: JsonTransactionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new JsonTransactionRepository();
  });

  describe('when data file does not exist', () => {
    beforeEach(() => {
      mockedFs.existsSync.mockReturnValue(false);
    });

    it('findAll returns empty array', async () => {
      expect(await repo.findAll()).toEqual([]);
    });

    it('findById returns null', async () => {
      expect(await repo.findById('txn-1')).toBeNull();
    });
  });

  describe('when data file exists', () => {
    const t1 = makeTransaction('txn-1');
    const t2 = makeTransaction('txn-2', TransactionStatus.PENDING);

    beforeEach(() => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(serializeTransactions([t1, t2]));
    });

    it('findAll returns transactions in reverse order', async () => {
      const result = await repo.findAll();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('txn-2'); // reversed
      expect(result[1].id).toBe('txn-1');
    });

    it('findById returns matching transaction', async () => {
      const result = await repo.findById('txn-1');
      expect(result?.id).toBe('txn-1');
      expect(result?.status).toBe(TransactionStatus.APPROVED);
    });

    it('findById returns null when not found', async () => {
      expect(await repo.findById('unknown')).toBeNull();
    });
  });

  describe('save', () => {
    it('saves transaction and returns it', async () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.mkdirSync.mockImplementation(() => undefined);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const txn = makeTransaction('txn-new');
      const result = await repo.save(txn);

      expect(result.id).toBe('txn-new');
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
      const [writtenPath, writtenContent] = mockedFs.writeFileSync.mock.calls[0];
      expect(String(writtenPath)).toMatch(DATA_PATH_PATTERN);
      const parsed = JSON.parse(String(writtenContent));
      expect(parsed[0].id).toBe('txn-new');
    });

    it('appends to existing transactions', async () => {
      const existing = makeTransaction('txn-1');
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(serializeTransactions([existing]));
      mockedFs.mkdirSync.mockImplementation(() => undefined);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      await repo.save(makeTransaction('txn-2'));

      const [, content] = mockedFs.writeFileSync.mock.calls[0];
      const parsed = JSON.parse(String(content));
      expect(parsed).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('updates an existing transaction', async () => {
      const existing = makeTransaction('txn-1');
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(serializeTransactions([existing]));
      mockedFs.mkdirSync.mockImplementation(() => undefined);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const updated = makeTransaction('txn-1', TransactionStatus.DECLINED);
      const result = await repo.update(updated);

      expect(result.status).toBe(TransactionStatus.DECLINED);
      const [, writtenContent] = mockedFs.writeFileSync.mock.calls[0];
      const parsed = JSON.parse(String(writtenContent));
      expect(parsed[0].status).toBe(TransactionStatus.DECLINED);
    });

    it('throws when transaction id is not found', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      await expect(repo.update(makeTransaction('txn-999'))).rejects.toThrow(
        'Transaction txn-999 not found for update',
      );
    });
  });
});
