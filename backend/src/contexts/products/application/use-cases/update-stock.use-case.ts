import { Injectable } from '@nestjs/common';
import { Product } from '../../domain/product.entity';
import { ProductRepository } from '../../domain/product.repository';
import { Result, ok, err } from '../../../../shared/result';

export interface UpdateStockCommand {
  productId: string;
  quantity: number;
}

@Injectable()
export class UpdateStockUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(command: UpdateStockCommand): Promise<Result<Product>> {
    const product = await this.repository.findById(command.productId);
    if (!product) return err('Product not found');

    if (command.quantity <= 0) return err('Quantity must be greater than zero');

    if (product.stock < command.quantity) {
      return err(`Insufficient stock. Available: ${product.stock}`);
    }

    const updated = product.withStock(product.stock - command.quantity);
    const saved = await this.repository.update(updated);
    return ok(saved);
  }
}
