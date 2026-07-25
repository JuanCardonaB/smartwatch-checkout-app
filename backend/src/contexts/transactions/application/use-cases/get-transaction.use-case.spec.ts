import { GetTransactionUseCase } from './get-transaction.use-case';
import { TransactionRepository } from '../../domain/transaction.repository';
import { Transaction } from '../../domain/transaction.entity';
import { TransactionStatus } from '../../domain/transaction-status.enum';

const mockRepo = (): jest.Mocked<TransactionRepository> => ({
  findById: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const makeTransaction = () =>
  new Transaction(
    'txn-1', null, 'SW-ref', 'cust-1', 'prod-1',
    29900000, 300000, 500000, 30700000,
    TransactionStatus.PENDING, null, null,
    new Date(), new Date(),
  );

describe('GetTransactionUseCase', () => {
  let useCase: GetTransactionUseCase;
  let repository: jest.Mocked<TransactionRepository>;

  beforeEach(() => {
    repository = mockRepo();
    useCase = new GetTransactionUseCase(repository);
  });

  it('returns the transaction when found', async () => {
    const txn = makeTransaction();
    repository.findById.mockResolvedValue(txn);

    const result = await useCase.execute('txn-1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe(txn);
    expect(repository.findById).toHaveBeenCalledWith('txn-1');
  });

  it('returns err when transaction is not found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute('non-existent');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('Transaction not found');
  });
});
