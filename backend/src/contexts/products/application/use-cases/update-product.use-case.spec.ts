import { UpdateProductUseCase } from './update-product.use-case';
import { ProductRepository } from '../../domain/product.repository';
import { Product } from '../../domain/product.entity';

const mockRepository = (): jest.Mocked<ProductRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const existingProduct = new Product(
  'id-1',
  'Old Name',
  'old desc',
  10000,
  ['https://old.com/img.png'],
  3,
  new Date('2026-01-01'),
);

const validCommand = {
  id: 'id-1',
  name: 'New Name',
  description: 'new desc',
  priceInCents: 29900000,
  imageUrls: ['https://new.com/img.png'],
  stock: 10,
};

describe('UpdateProductUseCase', () => {
  let useCase: UpdateProductUseCase;
  let repository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    repository = mockRepository();
    useCase = new UpdateProductUseCase(repository);
    repository.findById.mockResolvedValue(existingProduct);
    repository.update.mockImplementation(async (p: Product) => p);
  });

  it('updates a product successfully and preserves id and createdAt', async () => {
    const result = await useCase.execute(validCommand);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBe('id-1');
    expect(result.value.name).toBe('New Name');
    expect(result.value.priceInCents).toBe(29900000);
    expect(result.value.imageUrls).toEqual(['https://new.com/img.png']);
    expect(result.value.createdAt).toEqual(existingProduct.createdAt);
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it('trims name, description and imageUrls', async () => {
    const result = await useCase.execute({
      ...validCommand,
      name: '  New Name  ',
      description: '  new desc  ',
      imageUrls: ['  https://new.com/img.png  '],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe('New Name');
    expect(result.value.description).toBe('new desc');
    expect(result.value.imageUrls).toEqual(['https://new.com/img.png']);
  });

  it('returns error when product does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute(validCommand);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('Product not found');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('returns error for invalid price', async () => {
    const result = await useCase.execute({ ...validCommand, priceInCents: 0 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('Price');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('returns error for negative stock', async () => {
    const result = await useCase.execute({ ...validCommand, stock: -1 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('Stock cannot be negative');
    expect(repository.update).not.toHaveBeenCalled();
  });
});
