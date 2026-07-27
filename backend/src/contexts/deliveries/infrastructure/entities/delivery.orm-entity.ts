import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { DeliveryStatus } from '../../domain/delivery-status.enum';

@Entity('deliveries')
export class DeliveryOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid', { name: 'transaction_id' })
  transactionId: string;

  @Column('uuid', { name: 'customer_id' })
  customerId: string;

  @Column({ name: 'recipient_name' })
  recipientName: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column()
  department: string;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.PENDING })
  status: DeliveryStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
