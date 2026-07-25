import { CreateCustomerUseCase } from './create-customer.use-case';
import { CustomerRepository } from '../../domain/customer.repository';
import { Customer } from '../../domain/customer.entity';

const mockRepository = (): jest.Mocked<CustomerRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

describe('CreateCustomerUseCase', () => {
  let useCase: CreateCustomerUseCase;
  let repository: jest.Mocked<CustomerRepository>;

  beforeEach(() => {
    repository = mockRepository();
    useCase = new CreateCustomerUseCase(repository);
  });

  it('creates a customer successfully', async () => {
    repository.findByEmail.mockResolvedValue(null);
    repository.save.mockImplementation(async (c) => c);

    const result = await useCase.execute({
      name: 'Juan Cardona',
      email: 'juan@example.com',
      phone: '+573001234567',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe('Juan Cardona');
    expect(result.value.email).toBe('juan@example.com');
    expect(result.value.id).toBeDefined();
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('returns error for invalid email format', async () => {
    const result = await useCase.execute({
      name: 'Juan',
      email: 'not-valid',
      phone: '+573001234567',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('Invalid email format');
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('returns error when email is already registered', async () => {
    const existing = new Customer('id-1', 'Existing', 'juan@example.com', '+1111', new Date());
    repository.findByEmail.mockResolvedValue(existing);

    const result = await useCase.execute({
      name: 'Juan',
      email: 'juan@example.com',
      phone: '+573001234567',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('Email already registered');
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('normalizes email to lowercase before checking uniqueness', async () => {
    repository.findByEmail.mockResolvedValue(null);
    repository.save.mockImplementation(async (c) => c);

    await useCase.execute({
      name: 'Juan',
      email: 'JUAN@EXAMPLE.COM',
      phone: '+573001234567',
    });

    expect(repository.findByEmail).toHaveBeenCalledWith('juan@example.com');
  });

  it('trims name and phone before saving', async () => {
    repository.findByEmail.mockResolvedValue(null);
    repository.save.mockImplementation(async (c) => c);

    const result = await useCase.execute({
      name: '  Juan Cardona  ',
      email: 'juan@example.com',
      phone: '  +573001234567  ',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe('Juan Cardona');
    expect(result.value.phone).toBe('+573001234567');
  });
});
