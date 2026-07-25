import { CreateProductUseCase } from './create-product.use-case';
import { ProductRepository } from '../../domain/product.repository';
import { Product } from '../../domain/product.entity';

const mockRepository = (): jest.Mocked<ProductRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const validCommand = {
  name: 'Smartwatch Pro X1',
  description: 'A great smartwatch',
  priceInCents: 29900000,
  imageUrl: 'https://example.com/img.png',
  stock: 10,
};

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let repository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    repository = mockRepository();
    useCase = new CreateProductUseCase(repository);
    repository.save.mockImplementation(async (p: Product) => p);
  });

  it('creates a product successfully', async () => {
    const result = await useCase.execute(validCommand);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe('Smartwatch Pro X1');
    expect(result.value.priceInCents).toBe(29900000);
    expect(result.value.stock).toBe(10);
    expect(result.value.id).toBeDefined();
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('trims name, description and imageUrl', async () => {
    const result = await useCase.execute({
      ...validCommand,
      name: '  Smartwatch  ',
      description: '  desc  ',
      imageUrl: '  https://example.com/img.png  ',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe('Smartwatch');
    expect(result.value.description).toBe('desc');
  });

  it('returns error for invalid price (zero)', async () => {
    const result = await useCase.execute({ ...validCommand, priceInCents: 0 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('Price');
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('returns error for negative price', async () => {
    const result = await useCase.execute({ ...validCommand, priceInCents: -100 });
    expect(result.ok).toBe(false);
  });

  it('returns error for negative stock', async () => {
    const result = await useCase.execute({ ...validCommand, stock: -1 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('Stock cannot be negative');
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('allows zero stock', async () => {
    const result = await useCase.execute({ ...validCommand, stock: 0 });
    expect(result.ok).toBe(true);
  });
});
