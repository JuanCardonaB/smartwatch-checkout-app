import * as fs from 'fs';
import { JsonCustomerRepository } from './json-customer.repository';
import { Customer } from '../../domain/customer.entity';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

const DATA_PATH_PATTERN = /customers\.json$/;

const makeCustomer = (id = 'c-1') =>
  new Customer(id, 'Juan Cardona', 'juan@example.com', '+573001234567', new Date('2026-01-01'));

const serializeCustomers = (customers: Customer[]) =>
  JSON.stringify(
    customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      createdAt: c.createdAt.toISOString(),
    })),
    null,
    2,
  );

describe('JsonCustomerRepository', () => {
  let repo: JsonCustomerRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new JsonCustomerRepository();
  });

  describe('when data file does not exist', () => {
    beforeEach(() => {
      mockedFs.existsSync.mockReturnValue(false);
    });

    it('findAll returns empty array', async () => {
      const result = await repo.findAll();
      expect(result).toEqual([]);
    });

    it('findById returns null', async () => {
      const result = await repo.findById('c-1');
      expect(result).toBeNull();
    });

    it('findByEmail returns null', async () => {
      const result = await repo.findByEmail('juan@example.com');
      expect(result).toBeNull();
    });
  });

  describe('when data file exists with customers', () => {
    const customer1 = makeCustomer('c-1');
    const customer2 = makeCustomer('c-2');

    beforeEach(() => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(serializeCustomers([customer1, customer2]));
    });

    it('findAll returns all customers in reverse order', async () => {
      const result = await repo.findAll();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('c-2'); // reversed
      expect(result[1].id).toBe('c-1');
    });

    it('findById returns matching customer', async () => {
      const result = await repo.findById('c-1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('c-1');
    });

    it('findById returns null when not found', async () => {
      const result = await repo.findById('unknown');
      expect(result).toBeNull();
    });

    it('findByEmail returns matching customer', async () => {
      const result = await repo.findByEmail('juan@example.com');
      expect(result).not.toBeNull();
      expect(result!.email).toBe('juan@example.com');
    });

    it('findByEmail returns null when not found', async () => {
      const result = await repo.findByEmail('nobody@example.com');
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('saves a new customer and returns it', async () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.mkdirSync.mockImplementation(() => undefined);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const customer = makeCustomer('c-new');
      const result = await repo.save(customer);

      expect(result.id).toBe('c-new');
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
      const [writtenPath, writtenContent] = mockedFs.writeFileSync.mock.calls[0];
      expect(String(writtenPath)).toMatch(DATA_PATH_PATTERN);
      const parsed = JSON.parse(String(writtenContent));
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('c-new');
    });

    it('appends customer to existing customers', async () => {
      const existing = makeCustomer('c-1');
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(serializeCustomers([existing]));
      mockedFs.mkdirSync.mockImplementation(() => undefined);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const newCustomer = makeCustomer('c-2');
      await repo.save(newCustomer);

      const [, writtenContent] = mockedFs.writeFileSync.mock.calls[0];
      const parsed = JSON.parse(String(writtenContent));
      expect(parsed).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('updates an existing customer', async () => {
      const existing = makeCustomer('c-1');
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(serializeCustomers([existing]));
      mockedFs.mkdirSync.mockImplementation(() => undefined);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const updated = new Customer('c-1', 'New Name', 'juan@example.com', '+57999', new Date('2026-01-01'));
      const result = await repo.update(updated);

      expect(result.name).toBe('New Name');
      const [, writtenContent] = mockedFs.writeFileSync.mock.calls[0];
      const parsed = JSON.parse(String(writtenContent));
      expect(parsed[0].name).toBe('New Name');
    });

    it('throws when customer id is not found', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      await expect(repo.update(makeCustomer('c-999'))).rejects.toThrow('Customer c-999 not found for update');
    });
  });
});
