import { Injectable } from '@nestjs/common';
import { Transaction } from '../../domain/transaction.entity';
import { TransactionRepository } from '../../domain/transaction.repository';
import { Result, ok, err } from '../../../../shared/result';

@Injectable()
export class GetTransactionUseCase {
  constructor(private readonly repository: TransactionRepository) {}

  async execute(id: string): Promise<Result<Transaction>> {
    const transaction = await this.repository.findById(id);
    if (!transaction) return err('Transaction not found');
    return ok(transaction);
  }
}
