import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsString, IsUrl, Min } from 'class-validator';

export class UpdateProductDto {
  @ApiProperty({ example: 'Smartwatch Pro X1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Premium smartwatch with health monitoring and GPS.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 29900000, description: 'Price in cents (COP)' })
  @IsInt()
  @Min(1)
  priceInCents: number;

  @ApiProperty({
    example: [
      'https://example.com/smartwatch-front.png',
      'https://example.com/smartwatch-side.png',
    ],
    description: 'List of image URLs for the product',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  // require_tld: false so locally-served upload URLs (http://localhost:3000/...) are accepted
  @IsUrl({ require_tld: false }, { each: true })
  imageUrls: string[];

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  stock: number;
}
