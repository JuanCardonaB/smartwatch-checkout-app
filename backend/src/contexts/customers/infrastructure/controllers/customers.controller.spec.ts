import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CreateCustomerUseCase } from '../../application/use-cases/create-customer.use-case';
import { GetCustomerUseCase } from '../../application/use-cases/get-customer.use-case';
import { ListCustomersUseCase } from '../../application/use-cases/list-customers.use-case';
import { Customer } from '../../domain/customer.entity';
import { ok, err } from '../../../../shared/result';

describe('CustomersController', () => {
  let controller: CustomersController;
  let createCustomer: jest.Mocked<CreateCustomerUseCase>;
  let getCustomer: jest.Mocked<GetCustomerUseCase>;
  let listCustomers: jest.Mocked<ListCustomersUseCase>;

  const mockCustomer = new Customer(
    'uuid-1',
    'Juan Cardona',
    'juan@example.com',
    '+573001234567',
    new Date('2026-01-01'),
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        { provide: CreateCustomerUseCase, useValue: { execute: jest.fn() } },
        { provide: GetCustomerUseCase, useValue: { execute: jest.fn() } },
        { provide: ListCustomersUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get(CustomersController);
    createCustomer = module.get(CreateCustomerUseCase);
    getCustomer = module.get(GetCustomerUseCase);
    listCustomers = module.get(ListCustomersUseCase);
  });

  describe('GET /customers', () => {
    it('returns list of customers', async () => {
      listCustomers.execute.mockResolvedValue([mockCustomer]);

      const result = await controller.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('uuid-1');
    });

    it('returns empty list when no customers', async () => {
      listCustomers.execute.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('POST /customers', () => {
    it('returns 201 with customer data on success', async () => {
      createCustomer.execute.mockResolvedValue(ok(mockCustomer));

      const result = await controller.create({
        name: 'Juan Cardona',
        email: 'juan@example.com',
        phone: '+573001234567',
      });

      expect(result.id).toBe('uuid-1');
      expect(result.name).toBe('Juan Cardona');
      expect(result.email).toBe('juan@example.com');
    });

    it('throws 409 when email is already registered', async () => {
      createCustomer.execute.mockResolvedValue(err('Email already registered'));

      await expect(
        controller.create({ name: 'Juan', email: 'juan@example.com', phone: '+573001234567' }),
      ).rejects.toThrow(new HttpException('Email already registered', HttpStatus.CONFLICT));
    });

    it('throws 409 when email format is invalid (use case level)', async () => {
      createCustomer.execute.mockResolvedValue(err('Invalid email format'));

      await expect(
        controller.create({ name: 'Juan', email: 'bad', phone: '+573001234567' }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('GET /customers/:id', () => {
    it('returns 200 with customer data when found', async () => {
      getCustomer.execute.mockResolvedValue(ok(mockCustomer));

      const result = await controller.findOne('uuid-1');

      expect(result.id).toBe('uuid-1');
      expect(result.email).toBe('juan@example.com');
    });

    it('throws 404 when customer is not found', async () => {
      getCustomer.execute.mockResolvedValue(err('Customer not found'));

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        new HttpException('Customer not found', HttpStatus.NOT_FOUND),
      );
    });
  });
});
