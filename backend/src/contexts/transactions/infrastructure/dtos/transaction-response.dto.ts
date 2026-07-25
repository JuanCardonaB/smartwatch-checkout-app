import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '../../domain/transaction.entity';
import { TransactionStatus } from '../../domain/transaction-status.enum';

export class TransactionResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'SW-a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  reference: string;

  @ApiProperty({ example: 'wompi-txn-id-from-gateway' })
  wompiId: string | null;

  @ApiProperty({ example: 'cust-uuid' })
  customerId: string;

  @ApiProperty({ example: 'prod-uuid' })
  productId: string;

  @ApiProperty({ example: 29900000, description: 'Product price in cents' })
  productAmountInCents: number;

  @ApiProperty({
    example: 300000,
    description: 'Base fee in cents ($3,000 COP)',
  })
  baseFeeInCents: number;

  @ApiProperty({
    example: 500000,
    description: 'Delivery fee in cents ($5,000 COP)',
  })
  deliveryFeeInCents: number;

  @ApiProperty({ example: 30700000, description: 'Total charged in cents' })
  amountInCents: number;

  @ApiProperty({ enum: TransactionStatus, example: TransactionStatus.APPROVED })
  status: TransactionStatus;

  @ApiProperty({ example: '4111', nullable: true })
  cardLastFour: string | null;

  @ApiProperty({ example: 'VISA', nullable: true })
  cardBrand: string | null;

  @ApiProperty({ example: 'delivery-uuid', nullable: true })
  deliveryId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(
    transaction: Transaction,
    deliveryId: string | null = null,
  ): TransactionResponseDto {
    const dto = new TransactionResponseDto();
    dto.id = transaction.id;
    dto.reference = transaction.reference;
    dto.wompiId = transaction.wompiId;
    dto.customerId = transaction.customerId;
    dto.productId = transaction.productId;
    dto.productAmountInCents = transaction.productAmountInCents;
    dto.baseFeeInCents = transaction.baseFeeInCents;
    dto.deliveryFeeInCents = transaction.deliveryFeeInCents;
    dto.amountInCents = transaction.amountInCents;
    dto.status = transaction.status;
    dto.cardLastFour = transaction.cardLastFour;
    dto.cardBrand = transaction.cardBrand;
    dto.deliveryId = deliveryId;
    dto.createdAt = transaction.createdAt;
    dto.updatedAt = transaction.updatedAt;
    return dto;
  }
}
