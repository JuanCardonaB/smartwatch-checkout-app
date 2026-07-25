import { Injectable } from '@nestjs/common';
import { Product } from '../../domain/product.entity';
import { ProductRepository } from '../../domain/product.repository';
import { Result, ok, err } from '../../../../shared/result';

@Injectable()
export class GetProductUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(id: string): Promise<Result<Product>> {
    const product = await this.repository.findById(id);
    if (!product) return err('Product not found');
    return ok(product);
  }
}
