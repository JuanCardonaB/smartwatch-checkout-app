import { Injectable } from '@nestjs/common';
import { Product } from '../../domain/product.entity';
import { ProductRepository } from '../../domain/product.repository';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import { ProductPrice } from '../../domain/value-objects/product-price.vo';
import { Result, ok, err } from '../../../../shared/result';

export interface CreateProductCommand {
  name: string;
  description: string;
  priceInCents: number;
  imageUrls: string[];
  stock: number;
}

@Injectable()
export class CreateProductUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(command: CreateProductCommand): Promise<Result<Product>> {
    try {
      ProductPrice.from(command.priceInCents);
    } catch {
      return err('Price must be a positive integer in cents');
    }

    if (command.stock < 0) return err('Stock cannot be negative');

    const product = new Product(
      ProductId.generate().value,
      command.name.trim(),
      command.description.trim(),
      command.priceInCents,
      command.imageUrls.map((url) => url.trim()),
      command.stock,
      new Date(),
    );

    const saved = await this.repository.save(product);
    return ok(saved);
  }
}
