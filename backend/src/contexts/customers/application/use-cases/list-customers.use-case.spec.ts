import { ListCustomersUseCase } from './list-customers.use-case';
import { CustomerRepository } from '../../domain/customer.repository';
import { Customer } from '../../domain/customer.entity';

describe('ListCustomersUseCase', () => {
  let useCase: ListCustomersUseCase;
  let repository: jest.Mocked<CustomerRepository>;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as jest.Mocked<CustomerRepository>;

    useCase = new ListCustomersUseCase(repository);
  });

  it('returns all customers from the repository', async () => {
    const customers = [
      new Customer('c-1', 'Alice', 'alice@example.com', '+1000000001', new Date()),
      new Customer('c-2', 'Bob', 'bob@example.com', '+1000000002', new Date()),
    ];
    repository.findAll.mockResolvedValue(customers);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('c-1');
    expect(result[1].id).toBe('c-2');
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when no customers exist', async () => {
    repository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
