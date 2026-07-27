import { UpsertCustomerUseCase } from './upsert-customer.use-case';
import { CustomerRepository } from '../../domain/customer.repository';
import { Customer } from '../../domain/customer.entity';

const makeCustomer = () =>
  new Customer('cust-1', 'Juan Cardona', 'juan@example.com', '+573001234567', new Date());

describe('UpsertCustomerUseCase', () => {
  let useCase: UpsertCustomerUseCase;
  let repository: jest.Mocked<CustomerRepository>;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as jest.Mocked<CustomerRepository>;

    useCase = new UpsertCustomerUseCase(repository);
  });

  describe('invalid email', () => {
    it('returns err when email is missing @', async () => {
      const result = await useCase.execute({ name: 'Juan', email: 'notanemail', phone: '+573001234567' });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe('Invalid email format');
      expect(repository.findByEmail).not.toHaveBeenCalled();
    });

    it('returns err when email is empty string', async () => {
      const result = await useCase.execute({ name: 'Juan', email: '', phone: '+573001234567' });

      expect(result.ok).toBe(false);
    });

    it('returns err when email has no domain', async () => {
      const result = await useCase.execute({ name: 'Juan', email: 'juan@', phone: '+573001234567' });

      expect(result.ok).toBe(false);
    });
  });

  describe('new customer (email not found)', () => {
    it('creates and saves a new customer when email does not exist', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.save.mockImplementation(async (c) => c);

      const result = await useCase.execute({ name: 'Juan Cardona', email: 'juan@example.com', phone: '+573001234567' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.email).toBe('juan@example.com');
      expect(result.value.name).toBe('Juan Cardona');
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('normalises email to lowercase', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.save.mockImplementation(async (c) => c);

      const result = await useCase.execute({ name: 'Juan', email: 'JUAN@EXAMPLE.COM', phone: '+573001234567' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.email).toBe('juan@example.com');
    });

    it('trims whitespace from name and phone', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.save.mockImplementation(async (c) => c);

      const result = await useCase.execute({ name: '  Juan  ', email: 'juan@example.com', phone: '  +57300  ' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.name).toBe('Juan');
      expect(result.value.phone).toBe('+57300');
    });
  });

  describe('existing customer (email found)', () => {
    it('updates existing customer when email is already registered', async () => {
      const existing = makeCustomer();
      repository.findByEmail.mockResolvedValue(existing);
      repository.update.mockImplementation(async (c) => c);

      const result = await useCase.execute({ name: 'New Name', email: 'juan@example.com', phone: '+573009999999' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.name).toBe('New Name');
      expect(result.value.phone).toBe('+573009999999');
      expect(repository.update).toHaveBeenCalledTimes(1);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('preserves the original customer id on update', async () => {
      const existing = makeCustomer();
      repository.findByEmail.mockResolvedValue(existing);
      repository.update.mockImplementation(async (c) => c);

      const result = await useCase.execute({ name: 'New Name', email: 'juan@example.com', phone: '+57300' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.id).toBe('cust-1');
    });
  });
});
