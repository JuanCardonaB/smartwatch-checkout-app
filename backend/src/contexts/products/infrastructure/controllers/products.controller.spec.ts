import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { GetProductUseCase } from '../../application/use-cases/get-product.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { UpdateStockUseCase } from '../../application/use-cases/update-stock.use-case';
import { CloudinaryService } from '../cloudinary.service';
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
  let cloudinary: jest.Mocked<CloudinaryService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: GetProductUseCase, useValue: { execute: jest.fn() } },
        { provide: ListProductsUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateProductUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateStockUseCase, useValue: { execute: jest.fn() } },
        { provide: CloudinaryService, useValue: { uploadBuffer: jest.fn() } },
      ],
    }).compile();

    controller = module.get(ProductsController);
    getProduct = module.get(GetProductUseCase);
    listProducts = module.get(ListProductsUseCase);
    updateProduct = module.get(UpdateProductUseCase);
    updateStock = module.get(UpdateStockUseCase);
    cloudinary = module.get(CloudinaryService);
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
      getProduct.execute.mockResolvedValue(ok(mockProduct));
      updateProduct.execute.mockResolvedValue(ok(mockProduct));
      cloudinary.deleteRemoved = jest.fn().mockResolvedValue(undefined);

      const result = await controller.update('uuid-1', updateDto);

      expect(result.id).toBe('uuid-1');
      expect(updateProduct.execute).toHaveBeenCalledWith({ id: 'uuid-1', ...updateDto });
    });

    it('throws 404 when product is not found', async () => {
      getProduct.execute.mockResolvedValue(err('Product not found'));

      await expect(controller.update('bad-id', updateDto)).rejects.toThrow(
        new HttpException('Product not found', HttpStatus.NOT_FOUND),
      );
    });

    it('throws 400 when validation fails', async () => {
      getProduct.execute.mockResolvedValue(ok(mockProduct));
      updateProduct.execute.mockResolvedValue(err('Price must be a positive integer in cents'));
      cloudinary.deleteRemoved = jest.fn().mockResolvedValue(undefined);

      await expect(controller.update('uuid-1', updateDto)).rejects.toThrow(
        new HttpException('Price must be a positive integer in cents', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('POST /products/images', () => {
    it('returns cloudinary urls for uploaded files', async () => {
      const files = [
        { buffer: Buffer.from('img1'), mimetype: 'image/png' },
        { buffer: Buffer.from('img2'), mimetype: 'image/jpeg' },
      ] as Express.Multer.File[];

      cloudinary.uploadBuffer
        .mockResolvedValueOnce({ secure_url: 'https://res.cloudinary.com/demo/products/img1.png' } as any)
        .mockResolvedValueOnce({ secure_url: 'https://res.cloudinary.com/demo/products/img2.jpg' } as any);

      const result = await controller.uploadImages(files);

      expect(result.urls).toHaveLength(2);
      expect(result.urls[0]).toBe('https://res.cloudinary.com/demo/products/img1.png');
      expect(result.urls[1]).toBe('https://res.cloudinary.com/demo/products/img2.jpg');
    });

    it('throws 400 when no files uploaded', async () => {
      await expect(controller.uploadImages([])).rejects.toThrow('No files were uploaded');
    });

    it('throws 400 when files is null/undefined', async () => {
      await expect(controller.uploadImages(null as unknown as Express.Multer.File[])).rejects.toThrow('No files were uploaded');
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
