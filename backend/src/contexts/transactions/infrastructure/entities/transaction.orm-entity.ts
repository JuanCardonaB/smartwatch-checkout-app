import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { TransactionStatus } from '../../domain/transaction-status.enum';

@Entity('transactions')
export class TransactionOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'wompi_id', nullable: true, type: 'varchar' })
  wompiId: string | null;

  @Column({ unique: true })
  reference: string;

  @Column('uuid', { name: 'customer_id' })
  customerId: string;

  @Column('uuid', { name: 'product_id' })
  productId: string;

  @Column('bigint', { name: 'product_amount_in_cents' })
  productAmountInCents: number;

  @Column('bigint', { name: 'base_fee_in_cents' })
  baseFeeInCents: number;

  @Column('bigint', { name: 'delivery_fee_in_cents' })
  deliveryFeeInCents: number;

  @Column('bigint', { name: 'amount_in_cents' })
  amountInCents: number;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ name: 'card_last_four', nullable: true, type: 'varchar' })
  cardLastFour: string | null;

  @Column({ name: 'card_brand', nullable: true, type: 'varchar' })
  cardBrand: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
