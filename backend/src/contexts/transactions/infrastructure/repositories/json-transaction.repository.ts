import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Transaction } from '../../domain/transaction.entity';
import { TransactionRepository } from '../../domain/transaction.repository';
import { TransactionStatus } from '../../domain/transaction-status.enum';

const DATA_PATH = path.join(process.cwd(), 'data', 'transactions.json');

@Injectable()
export class JsonTransactionRepository implements TransactionRepository {
  private read(): Transaction[] {
    if (!fs.existsSync(DATA_PATH)) return [];
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Array<{
      id: string; wompiId: string | null; reference: string;
      customerId: string; productId: string;
      productAmountInCents: number; baseFeeInCents: number;
      deliveryFeeInCents: number; amountInCents: number;
      status: TransactionStatus; cardLastFour: string | null;
      cardBrand: string | null; createdAt: string; updatedAt: string;
    }>;
    return parsed.map(
      (t) => new Transaction(
        t.id, t.wompiId, t.reference, t.customerId, t.productId,
        t.productAmountInCents, t.baseFeeInCents, t.deliveryFeeInCents,
        t.amountInCents, t.status, t.cardLastFour, t.cardBrand,
        new Date(t.createdAt), new Date(t.updatedAt),
      ),
    );
  }

  private write(transactions: Transaction[]): void {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(transactions, null, 2), 'utf-8');
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.read().find((t) => t.id === id) ?? null;
  }

  async save(transaction: Transaction): Promise<Transaction> {
    const transactions = this.read();
    transactions.push(transaction);
    this.write(transactions);
    return transaction;
  }

  async update(transaction: Transaction): Promise<Transaction> {
    const transactions = this.read();
    const index = transactions.findIndex((t) => t.id === transaction.id);
    if (index === -1) throw new Error(`Transaction ${transaction.id} not found for update`);
    transactions[index] = transaction;
    this.write(transactions);
    return transaction;
  }
}
