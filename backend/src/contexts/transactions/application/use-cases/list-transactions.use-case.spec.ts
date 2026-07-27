import { ListTransactionsUseCase } from './list-transactions.use-case';
import { TransactionRepository } from '../../domain/transaction.repository';
import { Transaction } from '../../domain/transaction.entity';
import { TransactionStatus } from '../../domain/transaction-status.enum';

const makeTransaction = (id: string, status = TransactionStatus.APPROVED) =>
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
    new Date(),
    new Date(),
  );

describe('ListTransactionsUseCase', () => {
  let useCase: ListTransactionsUseCase;
  let repository: jest.Mocked<TransactionRepository>;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as jest.Mocked<TransactionRepository>;

    useCase = new ListTransactionsUseCase(repository);
  });

  it('returns all transactions from the repository', async () => {
    repository.findAll.mockResolvedValue([
      makeTransaction('txn-1'),
      makeTransaction('txn-2', TransactionStatus.PENDING),
    ]);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('txn-1');
    expect(result[1].id).toBe('txn-2');
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when no transactions exist', async () => {
    repository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
