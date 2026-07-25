import { GetDeliveryByTransactionUseCase } from './get-delivery-by-transaction.use-case';
import { DeliveryRepository } from '../../domain/delivery.repository';
import { Delivery } from '../../domain/delivery.entity';
import { DeliveryStatus } from '../../domain/delivery-status.enum';

const mockRepository = (): jest.Mocked<DeliveryRepository> => ({
  findById: jest.fn(),
  findByTransactionId: jest.fn(),
  save: jest.fn(),
});

const mockDelivery = new Delivery(
  'delivery-id-1', 'txn-abc', 'cust-1',
  'Juan', '+573001234567', 'Calle 1', 'Medellín', 'Antioquia',
  DeliveryStatus.PENDING, new Date(),
);

describe('GetDeliveryByTransactionUseCase', () => {
  let useCase: GetDeliveryByTransactionUseCase;
  let repository: jest.Mocked<DeliveryRepository>;

  beforeEach(() => {
    repository = mockRepository();
    useCase = new GetDeliveryByTransactionUseCase(repository);
  });

  it('returns a delivery when found by transaction ID', async () => {
    repository.findByTransactionId.mockResolvedValue(mockDelivery);

    const result = await useCase.execute('txn-abc');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe(mockDelivery);
    expect(repository.findByTransactionId).toHaveBeenCalledWith('txn-abc');
  });

  it('returns error when no delivery exists for the transaction', async () => {
    repository.findByTransactionId.mockResolvedValue(null);

    const result = await useCase.execute('txn-missing');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('Delivery not found for this transaction');
  });
});
