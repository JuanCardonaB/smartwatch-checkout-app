import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Product } from '../../domain/product.entity';
import { ProductRepository } from '../../domain/product.repository';

const DATA_PATH = path.join(process.cwd(), 'data', 'products.json');

@Injectable()
export class JsonProductRepository implements ProductRepository {
  private read(): Product[] {
    if (!fs.existsSync(DATA_PATH)) return [];
    const raw = fs.readFileSync(DATA_PATH, 'utf-8').trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{
      id: string;
      name: string;
      description: string;
      priceInCents: number;
      imageUrls: string[];
      stock: number;
      createdAt: string;
    }>;
    return parsed.map(
      (p) =>
        new Product(p.id, p.name, p.description, p.priceInCents, p.imageUrls, p.stock, new Date(p.createdAt)),
    );
  }

  private write(products: Product[]): void {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(products, null, 2), 'utf-8');
  }

  async findAll(): Promise<Product[]> {
    return this.read();
  }

  async findById(id: string): Promise<Product | null> {
    return this.read().find((p) => p.id === id) ?? null;
  }

  async save(product: Product): Promise<Product> {
    const products = this.read();
    products.push(product);
    this.write(products);
    return product;
  }

  async update(product: Product): Promise<Product> {
    const products = this.read();
    const index = products.findIndex((p) => p.id === product.id);
    if (index === -1) throw new Error(`Product ${product.id} not found for update`);
    products[index] = product;
    this.write(products);
    return product;
  }
}
