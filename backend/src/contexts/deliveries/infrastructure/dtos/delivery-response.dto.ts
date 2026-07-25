import { ApiProperty } from '@nestjs/swagger';
import { Delivery } from '../../domain/delivery.entity';
import { DeliveryStatus } from '../../domain/delivery-status.enum';

export class DeliveryResponseDto {
  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  transactionId: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  customerId: string;

  @ApiProperty({ example: 'Juan Cardona' })
  recipientName: string;

  @ApiProperty({ example: '+573001234567' })
  phone: string;

  @ApiProperty({ example: 'Calle 123 # 45-67, Apto 201' })
  address: string;

  @ApiProperty({ example: 'Medellín' })
  city: string;

  @ApiProperty({ example: 'Antioquia' })
  department: string;

  @ApiProperty({ enum: DeliveryStatus, example: DeliveryStatus.PENDING })
  status: DeliveryStatus;

  @ApiProperty()
  createdAt: Date;

  static fromEntity(delivery: Delivery): DeliveryResponseDto {
    const dto = new DeliveryResponseDto();
    dto.id = delivery.id;
    dto.transactionId = delivery.transactionId;
    dto.customerId = delivery.customerId;
    dto.recipientName = delivery.recipientName;
    dto.phone = delivery.phone;
    dto.address = delivery.address;
    dto.city = delivery.city;
    dto.department = delivery.department;
    dto.status = delivery.status;
    dto.createdAt = delivery.createdAt;
    return dto;
  }
}
