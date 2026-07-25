import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { DeliveriesController } from './deliveries.controller';
import { CreateDeliveryUseCase } from '../../application/use-cases/create-delivery.use-case';
import { GetDeliveryUseCase } from '../../application/use-cases/get-delivery.use-case';
import { GetDeliveryByTransactionUseCase } from '../../application/use-cases/get-delivery-by-transaction.use-case';
import { Delivery } from '../../domain/delivery.entity';
import { DeliveryStatus } from '../../domain/delivery-status.enum';
import { ok, err } from '../../../../shared/result';

const mockDelivery = new Delivery(
  'delivery-uuid-1',
  'txn-uuid-1',
  'cust-uuid-1',
  'Juan Cardona',
  '+573001234567',
  'Calle 123 # 45-67',
  'Medellín',
  'Antioquia',
  DeliveryStatus.PENDING,
  new Date('2026-01-01'),
);

describe('DeliveriesController', () => {
  let controller: DeliveriesController;
  let createDelivery: jest.Mocked<CreateDeliveryUseCase>;
  let getDelivery: jest.Mocked<GetDeliveryUseCase>;
  let getDeliveryByTransaction: jest.Mocked<GetDeliveryByTransactionUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveriesController],
      providers: [
        { provide: CreateDeliveryUseCase, useValue: { execute: jest.fn() } },
        { provide: GetDeliveryUseCase, useValue: { execute: jest.fn() } },
        { provide: GetDeliveryByTransactionUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get(DeliveriesController);
    createDelivery = module.get(CreateDeliveryUseCase);
    getDelivery = module.get(GetDeliveryUseCase);
    getDeliveryByTransaction = module.get(GetDeliveryByTransactionUseCase);
  });

  describe('POST /deliveries', () => {
    const dto = {
      transactionId: 'txn-uuid-1',
      customerId: 'cust-uuid-1',
      recipientName: 'Juan Cardona',
      phone: '+573001234567',
      address: 'Calle 123 # 45-67',
      city: 'Medellín',
      department: 'Antioquia',
    };

    it('returns 201 with delivery data on success', async () => {
      createDelivery.execute.mockResolvedValue(ok(mockDelivery));

      const result = await controller.create(dto);

      expect(result.id).toBe('delivery-uuid-1');
      expect(result.status).toBe(DeliveryStatus.PENDING);
      expect(result.city).toBe('Medellín');
    });

    it('throws 409 when delivery already exists for transaction', async () => {
      createDelivery.execute.mockResolvedValue(
        err('A delivery already exists for this transaction'),
      );

      await expect(controller.create(dto)).rejects.toThrow(
        new HttpException('A delivery already exists for this transaction', HttpStatus.CONFLICT),
      );
    });
  });

  describe('GET /deliveries/:id', () => {
    it('returns delivery when found', async () => {
      getDelivery.execute.mockResolvedValue(ok(mockDelivery));

      const result = await controller.findOne('delivery-uuid-1');

      expect(result.id).toBe('delivery-uuid-1');
      expect(result.transactionId).toBe('txn-uuid-1');
    });

    it('throws 404 when delivery is not found', async () => {
      getDelivery.execute.mockResolvedValue(err('Delivery not found'));

      await expect(controller.findOne('bad-id')).rejects.toThrow(
        new HttpException('Delivery not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('GET /deliveries/transaction/:transactionId', () => {
    it('returns delivery when found by transaction', async () => {
      getDeliveryByTransaction.execute.mockResolvedValue(ok(mockDelivery));

      const result = await controller.findByTransaction('txn-uuid-1');

      expect(result.transactionId).toBe('txn-uuid-1');
      expect(result.recipientName).toBe('Juan Cardona');
    });

    it('throws 404 when no delivery exists for transaction', async () => {
      getDeliveryByTransaction.execute.mockResolvedValue(
        err('Delivery not found for this transaction'),
      );

      await expect(controller.findByTransaction('txn-missing')).rejects.toThrow(
        new HttpException('Delivery not found for this transaction', HttpStatus.NOT_FOUND),
      );
    });
  });
});
