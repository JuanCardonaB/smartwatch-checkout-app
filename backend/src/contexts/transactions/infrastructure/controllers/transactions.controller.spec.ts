import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { CreateTransactionUseCase } from '../../application/use-cases/create-transaction.use-case';
import { GetTransactionUseCase } from '../../application/use-cases/get-transaction.use-case';
import { ListTransactionsUseCase } from '../../application/use-cases/list-transactions.use-case';
import { Transaction } from '../../domain/transaction.entity';
import { TransactionStatus } from '../../domain/transaction-status.enum';
import { ok, err } from '../../../../shared/result';

const makeTransaction = (status = TransactionStatus.APPROVED) =>
  new Transaction(
    'txn-uuid-1',
    'wompi-id-1',
    'SW-ref-1',
    'cust-uuid-1',
    'prod-uuid-1',
    29900000,
    300000,
    500000,
    30700000,
    status,
    '1111',
    'VISA',
    new Date('2026-01-01'),
    new Date('2026-01-01'),
  );

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let createTransaction: jest.Mocked<CreateTransactionUseCase>;
  let getTransaction: jest.Mocked<GetTransactionUseCase>;
  let listTransactions: jest.Mocked<ListTransactionsUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        { provide: CreateTransactionUseCase, useValue: { execute: jest.fn() } },
        { provide: GetTransactionUseCase, useValue: { execute: jest.fn() } },
        { provide: ListTransactionsUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get(TransactionsController);
    createTransaction = module.get(CreateTransactionUseCase);
    getTransaction = module.get(GetTransactionUseCase);
    listTransactions = module.get(ListTransactionsUseCase);
  });

  describe('GET /transactions', () => {
    it('returns list of transactions', async () => {
      listTransactions.execute.mockResolvedValue([makeTransaction()]);

      const result = await controller.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('txn-uuid-1');
      expect(result[0].status).toBe(TransactionStatus.APPROVED);
    });

    it('returns empty list when no transactions exist', async () => {
      listTransactions.execute.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('POST /transactions', () => {
    const dto = {
      customer: { name: 'Juan Cardona', email: 'juan@example.com', phone: '+573001234567' },
      productId: 'prod-uuid-1',
      card: { number: '4111111111111111', holder: 'Juan Cardona', expMonth: '12', expYear: '2030', cvc: '123' },
      delivery: { recipientName: 'Juan Cardona', phone: '+573001234567', address: 'Calle 1', city: 'Bogotá', department: 'Cundinamarca' },
    };

    it('returns 201 with transaction data on successful payment', async () => {
      const txn = makeTransaction();
      createTransaction.execute.mockResolvedValue(ok({ transaction: txn, deliveryId: 'del-uuid-1' }));

      const result = await controller.create(dto);

      expect(result.id).toBe('txn-uuid-1');
      expect(result.status).toBe(TransactionStatus.APPROVED);
      expect(result.deliveryId).toBe('del-uuid-1');
      expect(result.amountInCents).toBe(30700000);
    });

    it('returns 201 with null deliveryId when payment is PENDING', async () => {
      const txn = makeTransaction(TransactionStatus.PENDING);
      createTransaction.execute.mockResolvedValue(ok({ transaction: txn, deliveryId: null }));

      const result = await controller.create(dto);

      expect(result.status).toBe(TransactionStatus.PENDING);
      expect(result.deliveryId).toBeNull();
    });

    it('throws 400 when product is not found', async () => {
      createTransaction.execute.mockResolvedValue(err('Product not found'));

      await expect(controller.create(dto)).rejects.toThrow(
        new HttpException('Product not found', HttpStatus.BAD_REQUEST),
      );
    });

    it('throws 400 when product is out of stock', async () => {
      createTransaction.execute.mockResolvedValue(err('Product is out of stock'));

      await expect(controller.create(dto)).rejects.toThrow(
        new HttpException('Product is out of stock', HttpStatus.BAD_REQUEST),
      );
    });

    it('throws 400 when payment gateway fails', async () => {
      createTransaction.execute.mockResolvedValue(err('Payment gateway error. Transaction marked as ERROR.'));

      await expect(controller.create(dto)).rejects.toThrow(HttpException);
    });

    it('throws 400 when customer upsert fails', async () => {
      createTransaction.execute.mockResolvedValue(err('Invalid email format'));

      await expect(controller.create(dto)).rejects.toThrow(
        new HttpException('Invalid email format', HttpStatus.BAD_REQUEST),
      );
    });

    it('includes all fee fields in the response', async () => {
      const txn = makeTransaction();
      createTransaction.execute.mockResolvedValue(ok({ transaction: txn, deliveryId: null }));

      const result = await controller.create(dto);

      expect(result.productAmountInCents).toBe(29900000);
      expect(result.baseFeeInCents).toBe(300000);
      expect(result.deliveryFeeInCents).toBe(500000);
    });
  });

  describe('GET /transactions/:id', () => {
    it('returns 200 with transaction data when found', async () => {
      getTransaction.execute.mockResolvedValue(ok(makeTransaction()));

      const result = await controller.findOne('txn-uuid-1');

      expect(result.id).toBe('txn-uuid-1');
      expect(result.wompiId).toBe('wompi-id-1');
      expect(result.cardLastFour).toBe('1111');
    });

    it('throws 404 when transaction is not found', async () => {
      getTransaction.execute.mockResolvedValue(err('Transaction not found'));

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        new HttpException('Transaction not found', HttpStatus.NOT_FOUND),
      );
    });
  });
});
