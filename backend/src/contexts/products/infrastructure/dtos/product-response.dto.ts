import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../domain/product.entity';

export class ProductResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Smartwatch Pro X1' })
  name: string;

  @ApiProperty({ example: 'Premium smartwatch with health monitoring and GPS.' })
  description: string;

  @ApiProperty({ example: 29900000, description: 'Price in cents (COP)' })
  priceInCents: number;

  @ApiProperty({ example: 'https://example.com/smartwatch.png' })
  imageUrl: string;

  @ApiProperty({ example: 10 })
  stock: number;

  @ApiProperty()
  createdAt: Date;

  static fromEntity(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.description = product.description;
    dto.priceInCents = product.priceInCents;
    dto.imageUrl = product.imageUrl;
    dto.stock = product.stock;
    dto.createdAt = product.createdAt;
    return dto;
  }
}
