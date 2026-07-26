import { Injectable } from '@nestjs/common';
import { Transaction } from '../../domain/transaction.entity';
import { TransactionRepository } from '../../domain/transaction.repository';

@Injectable()
export class ListTransactionsUseCase {
  constructor(private readonly repository: TransactionRepository) {}

  async execute(): Promise<Transaction[]> {
    return this.repository.findAll();
  }
}
