import { GetProductUseCase } from './get-product.use-case';
import { ProductRepository } from '../../domain/product.repository';
import { Product } from '../../domain/product.entity';

const mockRepository = (): jest.Mocked<ProductRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const mockProduct = new Product('id-1', 'Smartwatch', 'desc', 29900000, ['https://img.com'], 10, new Date());

describe('GetProductUseCase', () => {
  let useCase: GetProductUseCase;
  let repository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    repository = mockRepository();
    useCase = new GetProductUseCase(repository);
  });

  it('returns a product when found', async () => {
    repository.findById.mockResolvedValue(mockProduct);

    const result = await useCase.execute('id-1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe(mockProduct);
    expect(repository.findById).toHaveBeenCalledWith('id-1');
  });

  it('returns error when product is not found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute('non-existent');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('Product not found');
  });
});
