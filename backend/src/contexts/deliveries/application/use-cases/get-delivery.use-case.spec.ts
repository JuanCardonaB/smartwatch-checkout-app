import { GetDeliveryUseCase } from './get-delivery.use-case';
import { DeliveryRepository } from '../../domain/delivery.repository';
import { Delivery } from '../../domain/delivery.entity';
import { DeliveryStatus } from '../../domain/delivery-status.enum';

const mockRepository = (): jest.Mocked<DeliveryRepository> => ({
  findById: jest.fn(),
  findByTransactionId: jest.fn(),
  save: jest.fn(),
});

const mockDelivery = new Delivery(
  'delivery-id-1', 'txn-1', 'cust-1',
  'Juan', '+573001234567', 'Calle 1', 'Medellín', 'Antioquia',
  DeliveryStatus.PENDING, new Date(),
);

describe('GetDeliveryUseCase', () => {
  let useCase: GetDeliveryUseCase;
  let repository: jest.Mocked<DeliveryRepository>;

  beforeEach(() => {
    repository = mockRepository();
    useCase = new GetDeliveryUseCase(repository);
  });

  it('returns a delivery when found', async () => {
    repository.findById.mockResolvedValue(mockDelivery);

    const result = await useCase.execute('delivery-id-1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe(mockDelivery);
    expect(repository.findById).toHaveBeenCalledWith('delivery-id-1');
  });

  it('returns error when delivery is not found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute('non-existent');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('Delivery not found');
  });
});
