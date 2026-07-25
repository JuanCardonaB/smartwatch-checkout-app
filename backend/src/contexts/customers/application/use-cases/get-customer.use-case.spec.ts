import { GetCustomerUseCase } from './get-customer.use-case';
import { CustomerRepository } from '../../domain/customer.repository';
import { Customer } from '../../domain/customer.entity';

const mockRepository = (): jest.Mocked<CustomerRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  save: jest.fn(),
});

describe('GetCustomerUseCase', () => {
  let useCase: GetCustomerUseCase;
  let repository: jest.Mocked<CustomerRepository>;

  beforeEach(() => {
    repository = mockRepository();
    useCase = new GetCustomerUseCase(repository);
  });

  it('returns a customer when found', async () => {
    const customer = new Customer('id-1', 'Juan', 'juan@example.com', '+573001234567', new Date());
    repository.findById.mockResolvedValue(customer);

    const result = await useCase.execute('id-1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe(customer);
    expect(repository.findById).toHaveBeenCalledWith('id-1');
  });

  it('returns error when customer is not found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute('non-existent-id');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('Customer not found');
  });
});
