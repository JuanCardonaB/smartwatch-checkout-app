import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { GetProductUseCase } from '../../application/use-cases/get-product.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { UpdateStockUseCase } from '../../application/use-cases/update-stock.use-case';
import { Product } from '../../domain/product.entity';
import { ok, err } from '../../../../shared/result';

const mockProduct = new Product(
  'uuid-1',
  'Smartwatch Pro X1',
  'desc',
  29900000,
  'https://img.com',
  10,
  new Date('2026-01-01'),
);

describe('ProductsController', () => {
  let controller: ProductsController;
  let createProduct: jest.Mocked<CreateProductUseCase>;
  let getProduct: jest.Mocked<GetProductUseCase>;
  let listProducts: jest.Mocked<ListProductsUseCase>;
  let updateStock: jest.Mocked<UpdateStockUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: CreateProductUseCase, useValue: { execute: jest.fn() } },
        { provide: GetProductUseCase, useValue: { execute: jest.fn() } },
        { provide: ListProductsUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateStockUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get(ProductsController);
    createProduct = module.get(CreateProductUseCase);
    getProduct = module.get(GetProductUseCase);
    listProducts = module.get(ListProductsUseCase);
    updateStock = module.get(UpdateStockUseCase);
  });

  describe('POST /products', () => {
    it('returns 201 with product data on success', async () => {
      createProduct.execute.mockResolvedValue(ok(mockProduct));

      const result = await controller.create({
        name: 'Smartwatch Pro X1',
        description: 'desc',
        priceInCents: 29900000,
        imageUrl: 'https://img.com',
        stock: 10,
      });

      expect(result.id).toBe('uuid-1');
      expect(result.stock).toBe(10);
    });

    it('throws 400 when use case returns error', async () => {
      createProduct.execute.mockResolvedValue(err('Price must be a positive integer in cents'));

      await expect(
        controller.create({
          name: 'X',
          description: 'X',
          priceInCents: 0,
          imageUrl: 'https://img.com',
          stock: 1,
        }),
      ).rejects.toThrow(new HttpException('Price must be a positive integer in cents', HttpStatus.BAD_REQUEST));
    });
  });

  describe('GET /products', () => {
    it('returns list of products', async () => {
      listProducts.execute.mockResolvedValue([mockProduct]);

      const result = await controller.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('uuid-1');
    });

    it('returns empty array when no products', async () => {
      listProducts.execute.mockResolvedValue([]);
      const result = await controller.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('GET /products/:id', () => {
    it('returns product when found', async () => {
      getProduct.execute.mockResolvedValue(ok(mockProduct));

      const result = await controller.findOne('uuid-1');

      expect(result.id).toBe('uuid-1');
    });

    it('throws 404 when product is not found', async () => {
      getProduct.execute.mockResolvedValue(err('Product not found'));

      await expect(controller.findOne('bad-id')).rejects.toThrow(
        new HttpException('Product not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('PATCH /products/:id/stock', () => {
    it('returns updated product on success', async () => {
      const updated = mockProduct.withStock(7);
      updateStock.execute.mockResolvedValue(ok(updated));

      const result = await controller.decrementStock('uuid-1', { quantity: 3 });

      expect(result.stock).toBe(7);
    });

    it('throws 404 when product is not found', async () => {
      updateStock.execute.mockResolvedValue(err('Product not found'));

      await expect(controller.decrementStock('bad-id', { quantity: 1 })).rejects.toThrow(
        new HttpException('Product not found', HttpStatus.NOT_FOUND),
      );
    });

    it('throws 409 when stock is insufficient', async () => {
      updateStock.execute.mockResolvedValue(err('Insufficient stock. Available: 2'));

      await expect(controller.decrementStock('uuid-1', { quantity: 5 })).rejects.toThrow(
        new HttpException('Insufficient stock. Available: 2', HttpStatus.CONFLICT),
      );
    });
  });
});
