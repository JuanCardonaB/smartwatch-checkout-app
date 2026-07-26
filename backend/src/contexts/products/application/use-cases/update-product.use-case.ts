import { Injectable } from '@nestjs/common';
import { Product } from '../../domain/product.entity';
import { ProductRepository } from '../../domain/product.repository';
import { ProductPrice } from '../../domain/value-objects/product-price.vo';
import { Result, ok, err } from '../../../../shared/result';

export interface UpdateProductCommand {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  imageUrls: string[];
  stock: number;
}

@Injectable()
export class UpdateProductUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(command: UpdateProductCommand): Promise<Result<Product>> {
    const existing = await this.repository.findById(command.id);
    if (!existing) return err('Product not found');

    try {
      ProductPrice.from(command.priceInCents);
    } catch {
      return err('Price must be a positive integer in cents');
    }

    if (command.stock < 0) return err('Stock cannot be negative');

    const updated = new Product(
      existing.id,
      command.name.trim(),
      command.description.trim(),
      command.priceInCents,
      command.imageUrls.map((url) => url.trim()),
      command.stock,
      existing.createdAt,
    );

    const saved = await this.repository.update(updated);
    return ok(saved);
  }
}
