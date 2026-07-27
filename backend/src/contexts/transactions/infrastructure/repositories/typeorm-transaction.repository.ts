import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../../domain/transaction.entity';
import { TransactionRepository } from '../../domain/transaction.repository';
import { TransactionOrmEntity } from '../entities/transaction.orm-entity';

@Injectable()
export class TypeOrmTransactionRepository implements TransactionRepository {
  constructor(
    @InjectRepository(TransactionOrmEntity)
    private readonly repo: Repository<TransactionOrmEntity>,
  ) {}

  private toDomain(e: TransactionOrmEntity): Transaction {
    return new Transaction(
      e.id,
      e.wompiId,
      e.reference,
      e.customerId,
      e.productId,
      Number(e.productAmountInCents),
      Number(e.baseFeeInCents),
      Number(e.deliveryFeeInCents),
      Number(e.amountInCents),
      e.status,
      e.cardLastFour,
      e.cardBrand,
      e.createdAt,
      e.updatedAt,
    );
  }

  async findAll(): Promise<Transaction[]> {
    const rows = await this.repo.find({ order: { createdAt: 'DESC' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<Transaction | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? this.toDomain(row) : null;
  }

  async save(transaction: Transaction): Promise<Transaction> {
    await this.repo.save({
      id: transaction.id,
      wompiId: transaction.wompiId,
      reference: transaction.reference,
      customerId: transaction.customerId,
      productId: transaction.productId,
      productAmountInCents: transaction.productAmountInCents,
      baseFeeInCents: transaction.baseFeeInCents,
      deliveryFeeInCents: transaction.deliveryFeeInCents,
      amountInCents: transaction.amountInCents,
      status: transaction.status,
      cardLastFour: transaction.cardLastFour,
      cardBrand: transaction.cardBrand,
    });
    return transaction;
  }

  async update(transaction: Transaction): Promise<Transaction> {
    await this.repo.update(transaction.id, {
      wompiId: transaction.wompiId,
      status: transaction.status,
      cardLastFour: transaction.cardLastFour,
      cardBrand: transaction.cardBrand,
    });
    return transaction;
  }
}
