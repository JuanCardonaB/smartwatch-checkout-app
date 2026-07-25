import { UpdateStockUseCase } from './update-stock.use-case';
import { ProductRepository } from '../../domain/product.repository';
import { Product } from '../../domain/product.entity';

const mockRepository = (): jest.Mocked<ProductRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const makeProduct = (stock: number) =>
  new Product('id-1', 'Smartwatch', 'desc', 29900000, 'https://img.com', stock, new Date());

describe('UpdateStockUseCase', () => {
  let useCase: UpdateStockUseCase;
  let repository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    repository = mockRepository();
    useCase = new UpdateStockUseCase(repository);
  });

  it('decrements stock correctly', async () => {
    repository.findById.mockResolvedValue(makeProduct(10));
    repository.update.mockImplementation(async (p: Product) => p);

    const result = await useCase.execute({ productId: 'id-1', quantity: 3 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.stock).toBe(7);
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it('allows decrementing to exactly zero', async () => {
    repository.findById.mockResolvedValue(makeProduct(2));
    repository.update.mockImplementation(async (p: Product) => p);

    const result = await useCase.execute({ productId: 'id-1', quantity: 2 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.stock).toBe(0);
  });

  it('returns error when product is not found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute({ productId: 'bad-id', quantity: 1 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('Product not found');
  });

  it('returns error when quantity is zero', async () => {
    repository.findById.mockResolvedValue(makeProduct(10));

    const result = await useCase.execute({ productId: 'id-1', quantity: 0 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('Quantity must be greater than zero');
  });

  it('returns error when stock is insufficient', async () => {
    repository.findById.mockResolvedValue(makeProduct(2));

    const result = await useCase.execute({ productId: 'id-1', quantity: 5 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('Insufficient stock');
    expect(repository.update).not.toHaveBeenCalled();
  });
});
