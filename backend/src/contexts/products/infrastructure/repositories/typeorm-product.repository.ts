import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../domain/product.entity';
import { ProductRepository } from '../../domain/product.repository';
import { ProductOrmEntity } from '../entities/product.orm-entity';

@Injectable()
export class TypeOrmProductRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repo: Repository<ProductOrmEntity>,
  ) {}

  private toDomain(e: ProductOrmEntity): Product {
    return new Product(
      e.id,
      e.name,
      e.description,
      Number(e.priceInCents),
      e.imageUrls,
      e.stock,
      e.createdAt,
    );
  }

  async findAll(): Promise<Product[]> {
    const rows = await this.repo.find();
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? this.toDomain(row) : null;
  }

  async save(product: Product): Promise<Product> {
    await this.repo.save({
      id: product.id,
      name: product.name,
      description: product.description,
      priceInCents: product.priceInCents,
      imageUrls: product.imageUrls,
      stock: product.stock,
      createdAt: product.createdAt,
    });
    return product;
  }

  async update(product: Product): Promise<Product> {
    await this.repo.update(product.id, {
      name: product.name,
      description: product.description,
      priceInCents: product.priceInCents,
      imageUrls: product.imageUrls,
      stock: product.stock,
    });
    return product;
  }
}
