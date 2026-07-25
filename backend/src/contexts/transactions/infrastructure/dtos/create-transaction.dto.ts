import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, IsUUID, Matches, ValidateNested } from 'class-validator';
import { CardDataDto } from './card-data.dto';

class CustomerInfoDto {
  @ApiProperty({ example: 'Juan Cardona' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+573001234567' })
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'phone must be a valid phone number' })
  phone: string;
}

class DeliveryInfoDto {
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

export class CreateTransactionDto {
  @ApiProperty({ type: CustomerInfoDto })
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer: CustomerInfoDto;

  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID()
  productId: string;

  @ApiProperty({ type: CardDataDto })
  @ValidateNested()
  @Type(() => CardDataDto)
  card: CardDataDto;

  @ApiProperty({ type: DeliveryInfoDto })
  @ValidateNested()
  @Type(() => DeliveryInfoDto)
  delivery: DeliveryInfoDto;
}
