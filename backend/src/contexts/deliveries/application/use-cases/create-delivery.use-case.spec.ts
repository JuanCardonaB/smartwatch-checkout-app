import { CreateDeliveryUseCase } from './create-delivery.use-case';
import { DeliveryRepository } from '../../domain/delivery.repository';
import { DeliveryStatus } from '../../domain/delivery-status.enum';
import { Delivery } from '../../domain/delivery.entity';

const mockRepository = (): jest.Mocked<DeliveryRepository> => ({
  findById: jest.fn(),
  findByTransactionId: jest.fn(),
  save: jest.fn(),
});

const validCommand = {
  transactionId: 'txn-uuid-1',
  customerId: 'cust-uuid-1',
  recipientName: 'Juan Cardona',
  phone: '+573001234567',
  address: 'Calle 123 # 45-67',
  city: 'Medellín',
  department: 'Antioquia',
};

describe('CreateDeliveryUseCase', () => {
  let useCase: CreateDeliveryUseCase;
  let repository: jest.Mocked<DeliveryRepository>;

  beforeEach(() => {
    repository = mockRepository();
    useCase = new CreateDeliveryUseCase(repository);
    repository.save.mockImplementation(async (d: Delivery) => d);
  });

  it('creates a delivery successfully with PENDING status', async () => {
    repository.findByTransactionId.mockResolvedValue(null);

    const result = await useCase.execute(validCommand);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe(DeliveryStatus.PENDING);
    expect(result.value.transactionId).toBe('txn-uuid-1');
    expect(result.value.customerId).toBe('cust-uuid-1');
    expect(result.value.id).toBeDefined();
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('trims all string fields before saving', async () => {
    repository.findByTransactionId.mockResolvedValue(null);

    const result = await useCase.execute({
      ...validCommand,
      recipientName: '  Juan Cardona  ',
      phone: '  +573001234567  ',
      address: '  Calle 123  ',
      city: '  Medellín  ',
      department: '  Antioquia  ',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.recipientName).toBe('Juan Cardona');
    expect(result.value.phone).toBe('+573001234567');
    expect(result.value.address).toBe('Calle 123');
    expect(result.value.city).toBe('Medellín');
    expect(result.value.department).toBe('Antioquia');
  });

  it('returns error when a delivery already exists for the transaction', async () => {
    const existing = new Delivery(
      'existing-id', 'txn-uuid-1', 'cust-uuid-1',
      'Existing', '+1111', 'Addr', 'City', 'Dept',
      DeliveryStatus.PENDING, new Date(),
    );
    repository.findByTransactionId.mockResolvedValue(existing);

    const result = await useCase.execute(validCommand);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('A delivery already exists for this transaction');
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('checks uniqueness using the transactionId from the command', async () => {
    repository.findByTransactionId.mockResolvedValue(null);

    await useCase.execute(validCommand);

    expect(repository.findByTransactionId).toHaveBeenCalledWith('txn-uuid-1');
  });
});
