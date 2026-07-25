import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Matches } from 'class-validator';

export class CreateDeliveryDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  transactionId: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'Juan Cardona' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ example: '+573001234567' })
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'phone must be a valid phone number' })
  phone: string;

  @ApiProperty({ example: 'Calle 123 # 45-67, Apto 201' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Medellín' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Antioquia' })
  @IsString()
  @IsNotEmpty()
  department: string;
}
