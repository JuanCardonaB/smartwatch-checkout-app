import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('products')
export class ProductOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('bigint', { name: 'price_in_cents' })
  priceInCents: number;

  @Column('text', { array: true, name: 'image_urls', default: '{}' })
  imageUrls: string[];

  @Column('int')
  stock: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
