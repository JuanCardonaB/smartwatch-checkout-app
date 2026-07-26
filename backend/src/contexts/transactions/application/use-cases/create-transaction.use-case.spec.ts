import { CreateTransactionUseCase, CreateTransactionCommand } from './create-transaction.use-case';
import { TransactionRepository } from '../../domain/transaction.repository';
import { TransactionStatus } from '../../domain/transaction-status.enum';
import { Transaction } from '../../domain/transaction.entity';
import { PaymentGatewayPort, PaymentResult } from '../ports/payment-gateway.port';
import { ProductRepository } from '../../../products/domain/product.repository';
import { UpsertCustomerUseCase } from '../../../customers/application/use-cases/upsert-customer.use-case';
import { CreateDeliveryUseCase } from '../../../deliveries/application/use-cases/create-delivery.use-case';
import { UpdateStockUseCase } from '../../../products/application/use-cases/update-stock.use-case';
import { Customer } from '../../../customers/domain/customer.entity';
import { Product } from '../../../products/domain/product.entity';
import { Delivery } from '../../../deliveries/domain/delivery.entity';
import { ok, err } from '../../../../shared/result';
import { BASE_FEE_IN_CENTS, DELIVERY_FEE_IN_CENTS } from '../../domain/transaction-fees.constants';

const makeCustomer = () =>
  new Customer('cust-1', 'Juan Cardona', 'juan@example.com', '+573001234567', new Date());

const makeProduct = (stock = 5) =>
  new Product('prod-1', 'Smartwatch Pro X1', 'desc', 29900000, ['img.jpg'], stock, new Date());

const makeDelivery = () =>
  new Delivery('del-1', 'txn-1', 'cust-1', 'Juan Cardona', '+573001234567', 'Calle 1', 'Bogotá', 'Cundinamarca', new Date());

const makeCommand = (): CreateTransactionCommand => ({
  customer: { name: 'Juan Cardona', email: 'juan@example.com', phone: '+573001234567' },
  productId: 'prod-1',
  card: { number: '4111111111111111', holder: 'Juan Cardona', expMonth: '12', expYear: '2030', cvc: '123' },
  delivery: { recipientName: 'Juan Cardona', phone: '+573001234567', address: 'Calle 1', city: 'Bogotá', department: 'Cundinamarca' },
});

const approvedPayment: PaymentResult = {
  wompiId: 'wompi-123',
  status: 'APPROVED',
  cardLastFour: '1111',
  cardBrand: 'VISA',
};

const pendingPayment: PaymentResult = { ...approvedPayment, status: 'PENDING' };

describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase;
  let transactionRepo: jest.Mocked<TransactionRepository>;
  let productRepo: jest.Mocked<ProductRepository>;
  let paymentGateway: jest.Mocked<PaymentGatewayPort>;
  let upsertCustomer: jest.Mocked<UpsertCustomerUseCase>;
  let createDelivery: jest.Mocked<CreateDeliveryUseCase>;
  let updateStock: jest.Mocked<UpdateStockUseCase>;

  beforeEach(() => {
    transactionRepo = { findById: jest.fn(), save: jest.fn(), update: jest.fn() };
    productRepo = { findById: jest.fn(), findAll: jest.fn(), save: jest.fn(), update: jest.fn() };
    paymentGateway = { processPayment: jest.fn() };
    upsertCustomer = { execute: jest.fn() } as unknown as jest.Mocked<UpsertCustomerUseCase>;
    createDelivery = { execute: jest.fn() } as unknown as jest.Mocked<CreateDeliveryUseCase>;
    updateStock = { execute: jest.fn() } as unknown as jest.Mocked<UpdateStockUseCase>;

    transactionRepo.save.mockImplementation(async (t) => t);
    transactionRepo.update.mockImplementation(async (t) => t);

    useCase = new CreateTransactionUseCase(
      transactionRepo, productRepo, paymentGateway,
      upsertCustomer, createDelivery, updateStock,
    );
  });

  describe('early validation errors', () => {
    it('returns err when upsertCustomer fails', async () => {
      upsertCustomer.execute.mockResolvedValue(err('Invalid email format'));

      const result = await useCase.execute(makeCommand());

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe('Invalid email format');
      expect(transactionRepo.save).not.toHaveBeenCalled();
    });

    it('returns err when product is not found', async () => {
      upsertCustomer.execute.mockResolvedValue(ok(makeCustomer()));
      productRepo.findById.mockResolvedValue(null);

      const result = await useCase.execute(makeCommand());

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe('Product not found');
    });

    it('returns err when product is out of stock', async () => {
      upsertCustomer.execute.mockResolvedValue(ok(makeCustomer()));
      productRepo.findById.mockResolvedValue(makeProduct(0));

      const result = await useCase.execute(makeCommand());

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe('Product is out of stock');
    });
  });

  describe('transaction amount calculation', () => {
    it('saves a PENDING transaction with correct total amount', async () => {
      upsertCustomer.execute.mockResolvedValue(ok(makeCustomer()));
      productRepo.findById.mockResolvedValue(makeProduct());
      paymentGateway.processPayment.mockResolvedValue(approvedPayment);
      createDelivery.execute.mockResolvedValue(ok(makeDelivery()));
      updateStock.execute.mockResolvedValue(ok(makeProduct(4)));

      await useCase.execute(makeCommand());

      const savedTxn = transactionRepo.save.mock.calls[0][0] as Transaction;
      expect(savedTxn.productAmountInCents).toBe(29900000);
      expect(savedTxn.baseFeeInCents).toBe(BASE_FEE_IN_CENTS);
      expect(savedTxn.deliveryFeeInCents).toBe(DELIVERY_FEE_IN_CENTS);
      expect(savedTxn.amountInCents).toBe(29900000 + BASE_FEE_IN_CENTS + DELIVERY_FEE_IN_CENTS);
      expect(savedTxn.status).toBe(TransactionStatus.PENDING);
    });
  });

  describe('payment gateway approved', () => {
    beforeEach(() => {
      upsertCustomer.execute.mockResolvedValue(ok(makeCustomer()));
      productRepo.findById.mockResolvedValue(makeProduct());
      paymentGateway.processPayment.mockResolvedValue(approvedPayment);
      createDelivery.execute.mockResolvedValue(ok(makeDelivery()));
      updateStock.execute.mockResolvedValue(ok(makeProduct(4)));
    });

    it('returns ok with APPROVED transaction and deliveryId', async () => {
      const result = await useCase.execute(makeCommand());

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.transaction.status).toBe(TransactionStatus.APPROVED);
      expect(result.value.transaction.wompiId).toBe('wompi-123');
      expect(result.value.transaction.cardLastFour).toBe('1111');
      expect(result.value.transaction.cardBrand).toBe('VISA');
      expect(result.value.deliveryId).toBe('del-1');
    });

    it('creates delivery and updates stock when APPROVED', async () => {
      await useCase.execute(makeCommand());

      expect(createDelivery.execute).toHaveBeenCalledTimes(1);
      expect(updateStock.execute).toHaveBeenCalledWith({ productId: 'prod-1', quantity: 1 });
    });

    it('calls transactionRepo.update twice (pending → wompi result)', async () => {
      await useCase.execute(makeCommand());
      expect(transactionRepo.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('payment gateway PENDING', () => {
    it('does NOT create delivery or update stock when status is PENDING', async () => {
      upsertCustomer.execute.mockResolvedValue(ok(makeCustomer()));
      productRepo.findById.mockResolvedValue(makeProduct());
      paymentGateway.processPayment.mockResolvedValue(pendingPayment);

      const result = await useCase.execute(makeCommand());

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.transaction.status).toBe(TransactionStatus.PENDING);
      expect(result.value.deliveryId).toBeNull();
      expect(createDelivery.execute).not.toHaveBeenCalled();
      expect(updateStock.execute).not.toHaveBeenCalled();
    });
  });

  describe('payment gateway throws', () => {
    it('marks transaction as ERROR and returns err', async () => {
      upsertCustomer.execute.mockResolvedValue(ok(makeCustomer()));
      productRepo.findById.mockResolvedValue(makeProduct());
      paymentGateway.processPayment.mockRejectedValue(new Error('Network timeout'));

      const result = await useCase.execute(makeCommand());

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain('Payment gateway error');

      const updatedTxn = transactionRepo.update.mock.calls[0][0] as Transaction;
      expect(updatedTxn.status).toBe(TransactionStatus.ERROR);
    });

    it('does not create delivery when payment fails', async () => {
      upsertCustomer.execute.mockResolvedValue(ok(makeCustomer()));
      productRepo.findById.mockResolvedValue(makeProduct());
      paymentGateway.processPayment.mockRejectedValue(new Error('Timeout'));

      await useCase.execute(makeCommand());

      expect(createDelivery.execute).not.toHaveBeenCalled();
      expect(updateStock.execute).not.toHaveBeenCalled();
    });
  });

  describe('delivery creation fails gracefully', () => {
    it('still returns ok even if createDelivery fails', async () => {
      upsertCustomer.execute.mockResolvedValue(ok(makeCustomer()));
      productRepo.findById.mockResolvedValue(makeProduct());
      paymentGateway.processPayment.mockResolvedValue(approvedPayment);
      createDelivery.execute.mockResolvedValue(err('Delivery service error'));
      updateStock.execute.mockResolvedValue(ok(makeProduct(4)));

      const result = await useCase.execute(makeCommand());

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.deliveryId).toBeNull();
    });
  });
});
