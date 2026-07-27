import * as fs from 'fs';
import { JsonDeliveryRepository } from './json-delivery.repository';
import { Delivery } from '../../domain/delivery.entity';
import { DeliveryStatus } from '../../domain/delivery-status.enum';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

const DATA_PATH_PATTERN = /deliveries\.json$/;

const makeDelivery = (id = 'd-1', txnId = 'txn-1') =>
  new Delivery(
    id,
    txnId,
    'cust-1',
    'Juan Cardona',
    '+573001234567',
    'Calle 123',
    'Bogotá',
    'Cundinamarca',
    DeliveryStatus.PENDING,
    new Date('2026-01-01'),
  );

const serializeDeliveries = (deliveries: Delivery[]) =>
  JSON.stringify(
    deliveries.map((d) => ({
      id: d.id,
      transactionId: d.transactionId,
      customerId: d.customerId,
      recipientName: d.recipientName,
      phone: d.phone,
      address: d.address,
      city: d.city,
      department: d.department,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    })),
    null,
    2,
  );

describe('JsonDeliveryRepository', () => {
  let repo: JsonDeliveryRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new JsonDeliveryRepository();
  });

  describe('when data file does not exist', () => {
    beforeEach(() => {
      mockedFs.existsSync.mockReturnValue(false);
    });

    it('findAll returns empty array', async () => {
      expect(await repo.findAll()).toEqual([]);
    });

    it('findById returns null', async () => {
      expect(await repo.findById('d-1')).toBeNull();
    });

    it('findByTransactionId returns null', async () => {
      expect(await repo.findByTransactionId('txn-1')).toBeNull();
    });
  });

  describe('when data file exists', () => {
    const d1 = makeDelivery('d-1', 'txn-1');
    const d2 = makeDelivery('d-2', 'txn-2');

    beforeEach(() => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(serializeDeliveries([d1, d2]));
    });

    it('findAll returns deliveries in reverse order', async () => {
      const result = await repo.findAll();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('d-2');
      expect(result[1].id).toBe('d-1');
    });

    it('findById returns matching delivery', async () => {
      const result = await repo.findById('d-1');
      expect(result?.id).toBe('d-1');
    });

    it('findById returns null when not found', async () => {
      expect(await repo.findById('unknown')).toBeNull();
    });

    it('findByTransactionId returns matching delivery', async () => {
      const result = await repo.findByTransactionId('txn-2');
      expect(result?.transactionId).toBe('txn-2');
    });

    it('findByTransactionId returns null when not found', async () => {
      expect(await repo.findByTransactionId('txn-999')).toBeNull();
    });
  });

  describe('save', () => {
    it('saves delivery and returns it', async () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.mkdirSync.mockImplementation(() => undefined);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const delivery = makeDelivery('d-new');
      const result = await repo.save(delivery);

      expect(result.id).toBe('d-new');
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
      const [writtenPath, writtenContent] = mockedFs.writeFileSync.mock.calls[0];
      expect(String(writtenPath)).toMatch(DATA_PATH_PATTERN);
      const parsed = JSON.parse(String(writtenContent));
      expect(parsed[0].id).toBe('d-new');
    });
  });
});
