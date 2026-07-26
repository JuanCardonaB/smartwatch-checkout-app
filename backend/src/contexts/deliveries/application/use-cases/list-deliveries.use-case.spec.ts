import { ListDeliveriesUseCase } from './list-deliveries.use-case';
import { DeliveryRepository } from '../../domain/delivery.repository';
import { Delivery } from '../../domain/delivery.entity';
import { DeliveryStatus } from '../../domain/delivery-status.enum';

const makeDelivery = (id: string) =>
  new Delivery(id, 'txn-1', 'cust-1', 'Juan', '+57300', 'Calle 1', 'Bogotá', 'Cundinamarca', DeliveryStatus.PENDING, new Date());

describe('ListDeliveriesUseCase', () => {
  let useCase: ListDeliveriesUseCase;
  let repository: jest.Mocked<DeliveryRepository>;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByTransactionId: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<DeliveryRepository>;

    useCase = new ListDeliveriesUseCase(repository);
  });

  it('returns all deliveries from the repository', async () => {
    repository.findAll.mockResolvedValue([makeDelivery('d-1'), makeDelivery('d-2')]);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('d-1');
    expect(result[1].id).toBe('d-2');
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when no deliveries exist', async () => {
    repository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
