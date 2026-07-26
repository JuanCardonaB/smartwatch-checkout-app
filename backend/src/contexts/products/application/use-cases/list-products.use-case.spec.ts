import { ListProductsUseCase } from './list-products.use-case';
import { ProductRepository } from '../../domain/product.repository';
import { Product } from '../../domain/product.entity';

const mockRepository = (): jest.Mocked<ProductRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

describe('ListProductsUseCase', () => {
  let useCase: ListProductsUseCase;
  let repository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    repository = mockRepository();
    useCase = new ListProductsUseCase(repository);
  });

  it('returns all products', async () => {
    const products = [
      new Product('id-1', 'Smartwatch', 'desc', 29900000, ['https://img.com'], 10, new Date()),
      new Product('id-2', 'Band', 'desc', 9900000, ['https://img2.com'], 5, new Date()),
    ];
    repository.findAll.mockResolvedValue(products);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('id-1');
    expect(result[1].id).toBe('id-2');
  });

  it('returns empty array when no products exist', async () => {
    repository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
