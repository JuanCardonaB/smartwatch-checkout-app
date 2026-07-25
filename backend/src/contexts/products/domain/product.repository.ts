import { Product } from './product.entity';

export abstract class ProductRepository {
  abstract findAll(): Promise<Product[]>;
  abstract findById(id: string): Promise<Product | null>;
  abstract save(product: Product): Promise<Product>;
  abstract update(product: Product): Promise<Product>;
}
