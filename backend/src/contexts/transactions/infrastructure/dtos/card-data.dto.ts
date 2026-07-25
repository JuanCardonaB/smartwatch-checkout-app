import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsString, Length, Matches } from 'class-validator';

export class CardDataDto {
  @ApiProperty({
    example: '4111111111111111',
    description: 'Card number (13–19 digits, fake but valid structure)',
  })
  @IsNumberString()
  @Length(13, 19)
  number: string;

  @ApiProperty({ example: 'Juan Cardona' })
  @IsString()
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'holder must contain only letters and spaces',
  })
  holder: string;

  @ApiProperty({ example: '12', description: 'Expiry month (2 digits)' })
  @IsNumberString()
  @Length(2, 2)
  expMonth: string;

  @ApiProperty({ example: '2030', description: 'Expiry year (4 digits)' })
  @IsNumberString()
  @Length(4, 4)
  expYear: string;

  @ApiProperty({ example: '123', description: 'CVC (3–4 digits)' })
  @IsNumberString()
  @Length(3, 4)
  cvc: string;
}
