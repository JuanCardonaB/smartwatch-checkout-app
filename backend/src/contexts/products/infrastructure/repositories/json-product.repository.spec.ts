import * as fs from 'fs';
import { JsonProductRepository } from './json-product.repository';
import { Product } from '../../domain/product.entity';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

const DATA_PATH_PATTERN = /products\.json$/;

const makeProduct = (id = 'p-1') =>
  new Product(id, 'Smartwatch Pro X1', 'desc', 29900000, ['img.jpg'], 10, new Date('2026-01-01'));

const serializeProducts = (products: Product[]) =>
  JSON.stringify(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceInCents: p.priceInCents,
      imageUrls: p.imageUrls,
      stock: p.stock,
      createdAt: p.createdAt.toISOString(),
    })),
    null,
    2,
  );

describe('JsonProductRepository', () => {
  let repo: JsonProductRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new JsonProductRepository();
  });

  describe('when data file does not exist', () => {
    beforeEach(() => {
      mockedFs.existsSync.mockReturnValue(false);
    });

    it('findAll returns empty array', async () => {
      expect(await repo.findAll()).toEqual([]);
    });

    it('findById returns null', async () => {
      expect(await repo.findById('p-1')).toBeNull();
    });
  });

  describe('when data file is empty', () => {
    beforeEach(() => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('   ');
    });

    it('findAll returns empty array for empty file', async () => {
      expect(await repo.findAll()).toEqual([]);
    });
  });

  describe('when data file exists with products', () => {
    const p1 = makeProduct('p-1');
    const p2 = makeProduct('p-2');

    beforeEach(() => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(serializeProducts([p1, p2]));
    });

    it('findAll returns all products in insertion order', async () => {
      const result = await repo.findAll();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('p-1');
      expect(result[1].id).toBe('p-2');
    });

    it('findById returns matching product', async () => {
      const result = await repo.findById('p-1');
      expect(result?.id).toBe('p-1');
      expect(result?.name).toBe('Smartwatch Pro X1');
    });

    it('findById returns null when not found', async () => {
      expect(await repo.findById('unknown')).toBeNull();
    });
  });

  describe('save', () => {
    it('saves a product and returns it', async () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.mkdirSync.mockImplementation(() => undefined);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const product = makeProduct('p-new');
      const result = await repo.save(product);

      expect(result.id).toBe('p-new');
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
      const [writtenPath, writtenContent] = mockedFs.writeFileSync.mock.calls[0];
      expect(String(writtenPath)).toMatch(DATA_PATH_PATTERN);
      const parsed = JSON.parse(String(writtenContent));
      expect(parsed[0].id).toBe('p-new');
    });
  });

  describe('update', () => {
    it('updates an existing product', async () => {
      const existing = makeProduct('p-1');
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(serializeProducts([existing]));
      mockedFs.mkdirSync.mockImplementation(() => undefined);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const updated = new Product('p-1', 'Updated Name', 'new desc', 19900000, ['img2.jpg'], 5, new Date('2026-01-01'));
      const result = await repo.update(updated);

      expect(result.name).toBe('Updated Name');
      const [, writtenContent] = mockedFs.writeFileSync.mock.calls[0];
      const parsed = JSON.parse(String(writtenContent));
      expect(parsed[0].name).toBe('Updated Name');
    });

    it('throws when product id is not found', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      await expect(repo.update(makeProduct('p-999'))).rejects.toThrow('Product p-999 not found for update');
    });
  });
});
