import { Injectable } from '@nestjs/common';
import { Transaction } from '../../domain/transaction.entity';
import { TransactionRepository } from '../../domain/transaction.repository';
import { TransactionStatus } from '../../domain/transaction-status.enum';
import { TransactionId } from '../../domain/value-objects/transaction-id.vo';
import { TransactionReference } from '../../domain/value-objects/transaction-reference.vo';
import {
  BASE_FEE_IN_CENTS,
  DELIVERY_FEE_IN_CENTS,
} from '../../domain/transaction-fees.constants';
import { PaymentGatewayPort, CardData } from '../ports/payment-gateway.port';
import { ProductRepository } from '../../../products/domain/product.repository';
import { UpsertCustomerUseCase } from '../../../customers/application/use-cases/upsert-customer.use-case';
import { CreateDeliveryUseCase } from '../../../deliveries/application/use-cases/create-delivery.use-case';
import { UpdateStockUseCase } from '../../../products/application/use-cases/update-stock.use-case';
import { Result, ok, err } from '../../../../shared/result';

export interface CreateTransactionCommand {
  customer: { name: string; email: string; phone: string };
  productId: string;
  card: CardData;
  delivery: {
    recipientName: string;
    phone: string;
    address: string;
    city: string;
    department: string;
  };
}

export interface TransactionResult {
  transaction: Transaction;
  deliveryId: string | null;
}

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly productRepository: ProductRepository,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly upsertCustomer: UpsertCustomerUseCase,
    private readonly createDelivery: CreateDeliveryUseCase,
    private readonly updateStock: UpdateStockUseCase,
  ) {}

  async execute(
    command: CreateTransactionCommand,
  ): Promise<Result<TransactionResult>> {
    // 1. Upsert customer
    const customerResult = await this.upsertCustomer.execute(command.customer);
    if (!customerResult.ok) return err(customerResult.error);
    const customer = customerResult.value;

    // 2. Validate product and stock
    const product = await this.productRepository.findById(command.productId);
    if (!product) return err('Product not found');
    if (product.stock < 1) return err('Product is out of stock');

    // 3. Calculate total amount
    const productAmountInCents = product.priceInCents;
    const amountInCents =
      productAmountInCents + BASE_FEE_IN_CENTS + DELIVERY_FEE_IN_CENTS;

    // 4. Create PENDING transaction
    const reference = TransactionReference.generate().value;
    const pendingTransaction = new Transaction(
      TransactionId.generate().value,
      null,
      reference,
      customer.id,
      product.id,
      productAmountInCents,
      BASE_FEE_IN_CENTS,
      DELIVERY_FEE_IN_CENTS,
      amountInCents,
      TransactionStatus.PENDING,
      null,
      null,
      new Date(),
      new Date(),
    );

    const savedTransaction =
      await this.transactionRepository.save(pendingTransaction);

    // 5. Call payment gateway (Wompi)
    let paymentResult: Awaited<
      ReturnType<PaymentGatewayPort['processPayment']>
    >;
    try {
      paymentResult = await this.paymentGateway.processPayment({
        reference,
        amountInCents,
        card: command.card,
        customerEmail: customer.email,
      });
    } catch {
      const errorTransaction = savedTransaction.withWompiResult(
        '',
        TransactionStatus.ERROR,
        '',
        '',
      );
      await this.transactionRepository.update(errorTransaction);
      return err('Payment gateway error. Transaction marked as ERROR.');
    }

    // 6. Update transaction with Wompi result
    const finalTransaction = savedTransaction.withWompiResult(
      paymentResult.wompiId,
      TransactionStatus[paymentResult.status],
      paymentResult.cardLastFour,
      paymentResult.cardBrand,
    );
    await this.transactionRepository.update(finalTransaction);

    // 7. If APPROVED: create delivery + decrement stock
    let deliveryId: string | null = null;

    if (paymentResult.status === 'APPROVED') {
      const deliveryResult = await this.createDelivery.execute({
        transactionId: finalTransaction.id,
        customerId: customer.id,
        recipientName: command.delivery.recipientName,
        phone: command.delivery.phone,
        address: command.delivery.address,
        city: command.delivery.city,
        department: command.delivery.department,
      });

      if (deliveryResult.ok) {
        deliveryId = deliveryResult.value.id;
      }

      await this.updateStock.execute({ productId: product.id, quantity: 1 });
    }

    return ok({ transaction: finalTransaction, deliveryId });
  }
}
