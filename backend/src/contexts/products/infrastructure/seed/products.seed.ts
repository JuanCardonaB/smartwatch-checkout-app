import { Injectable, OnModuleInit } from '@nestjs/common';
import { ProductRepository } from '../../domain/product.repository';
import { Product } from '../../domain/product.entity';

const SEED_PRODUCT: Omit<Product, 'withStock'> = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  name: 'Smartwatch Pro X1',
  description:
    'Premium smartwatch with health monitoring, GPS, heart rate sensor, and 7-day battery life. Water resistant up to 50m.',
  priceInCents: 29900000,
  imageUrls: [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800',
  ],
  stock: 10,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

@Injectable()
export class ProductsSeed implements OnModuleInit {
  constructor(private readonly repository: ProductRepository) {}

  async onModuleInit(): Promise<void> {
    const existing = await this.repository.findById(SEED_PRODUCT.id);
    if (existing) return;

    const product = new Product(
      SEED_PRODUCT.id,
      SEED_PRODUCT.name,
      SEED_PRODUCT.description,
      SEED_PRODUCT.priceInCents,
      SEED_PRODUCT.imageUrls,
      SEED_PRODUCT.stock,
      SEED_PRODUCT.createdAt,
    );

    await this.repository.save(product);
  }
}
