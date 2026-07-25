import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../../domain/customer.entity';

export class CustomerResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Juan Cardona' })
  name: string;

  @ApiProperty({ example: 'juan@example.com' })
  email: string;

  @ApiProperty({ example: '+573001234567' })
  phone: string;

  @ApiProperty()
  createdAt: Date;

  static fromEntity(customer: Customer): CustomerResponseDto {
    const dto = new CustomerResponseDto();
    dto.id = customer.id;
    dto.name = customer.name;
    dto.email = customer.email;
    dto.phone = customer.phone;
    dto.createdAt = customer.createdAt;
    return dto;
  }
}
