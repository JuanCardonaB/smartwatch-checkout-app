import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { GetProductUseCase } from '../../application/use-cases/get-product.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { UpdateStockUseCase } from '../../application/use-cases/update-stock.use-case';
import { Product } from '../../domain/product.entity';
import { ok, err } from '../../../../shared/result';

const mockProduct = new Product(
  'uuid-1',
  'Smartwatch Pro X1',
  'desc',
  29900000,
  ['https://img.com'],
  10,
  new Date('2026-01-01'),
);

describe('ProductsController', () => {
  let controller: ProductsController;
  let getProduct: jest.Mocked<GetProductUseCase>;
  let listProducts: jest.Mocked<ListProductsUseCase>;
  let updateProduct: jest.Mocked<UpdateProductUseCase>;
  let updateStock: jest.Mocked<UpdateStockUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: GetProductUseCase, useValue: { execute: jest.fn() } },
        { provide: ListProductsUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateProductUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateStockUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get(ProductsController);
    getProduct = module.get(GetProductUseCase);
    listProducts = module.get(ListProductsUseCase);
    updateProduct = module.get(UpdateProductUseCase);
    updateStock = module.get(UpdateStockUseCase);
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

  describe('PUT /products/:id', () => {
    const updateDto = {
      name: 'Updated Watch',
      description: 'updated desc',
      priceInCents: 19900000,
      imageUrls: ['https://img.com/new.png'],
      stock: 5,
    };

    it('returns updated product on success', async () => {
      updateProduct.execute.mockResolvedValue(ok(mockProduct));

      const result = await controller.update('uuid-1', updateDto);

      expect(result.id).toBe('uuid-1');
      expect(updateProduct.execute).toHaveBeenCalledWith({ id: 'uuid-1', ...updateDto });
    });

    it('throws 404 when product is not found', async () => {
      updateProduct.execute.mockResolvedValue(err('Product not found'));

      await expect(controller.update('bad-id', updateDto)).rejects.toThrow(
        new HttpException('Product not found', HttpStatus.NOT_FOUND),
      );
    });

    it('throws 400 when validation fails', async () => {
      updateProduct.execute.mockResolvedValue(err('Price must be a positive integer in cents'));

      await expect(controller.update('uuid-1', updateDto)).rejects.toThrow(
        new HttpException('Price must be a positive integer in cents', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('POST /products/images', () => {
    it('returns urls for uploaded files', () => {
      const files = [
        { filename: 'img1.png', originalname: 'img1.png', mimetype: 'image/png' },
        { filename: 'img2.jpg', originalname: 'img2.jpg', mimetype: 'image/jpeg' },
      ] as Express.Multer.File[];

      const req = {
        protocol: 'http',
        get: (header: string) => (header === 'host' ? 'localhost:3000' : ''),
      } as unknown as import('express').Request;

      const result = controller.uploadImages(files, req);

      expect(result.urls).toHaveLength(2);
      expect(result.urls[0]).toBe('http://localhost:3000/uploads/img1.png');
      expect(result.urls[1]).toBe('http://localhost:3000/uploads/img2.jpg');
    });

    it('throws 400 when no files uploaded', () => {
      const req = {
        protocol: 'http',
        get: () => 'localhost:3000',
      } as unknown as import('express').Request;

      expect(() => controller.uploadImages([], req)).toThrow('No files were uploaded');
    });

    it('throws 400 when files is null/undefined', () => {
      const req = {
        protocol: 'http',
        get: () => 'localhost:3000',
      } as unknown as import('express').Request;

      expect(() => controller.uploadImages(null as unknown as Express.Multer.File[], req)).toThrow('No files were uploaded');
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
