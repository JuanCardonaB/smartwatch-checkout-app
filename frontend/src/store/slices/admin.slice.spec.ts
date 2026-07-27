import { configureStore } from '@reduxjs/toolkit';

jest.mock('../../services/api', () => ({
  productsApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    uploadImages: jest.fn(),
  },
  transactionsApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    getById: jest.fn(),
  },
  customersApi: { getAll: jest.fn() },
  deliveriesApi: { getAll: jest.fn() },
}));

import adminReducer, {
  fetchProduct,
  fetchOrders,
  updateProduct,
  clearAdminError,
} from './admin.slice';
import { productsApi, transactionsApi, customersApi, deliveriesApi } from '../../services/api';

const mockedProductsApi = productsApi as jest.Mocked<typeof productsApi>;
const mockedTransactionsApi = transactionsApi as jest.Mocked<typeof transactionsApi>;
const mockedCustomersApi = customersApi as jest.Mocked<typeof customersApi>;
const mockedDeliveriesApi = deliveriesApi as jest.Mocked<typeof deliveriesApi>;

const makeStore = () =>
  configureStore({ reducer: { admin: adminReducer } });

const mockProduct = {
  id: 'prod-1',
  name: 'Smartwatch Pro X1',
  description: 'desc',
  priceInCents: 29900000,
  imageUrls: ['https://img.com'],
  stock: 10,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockTransaction = {
  id: 'txn-1',
  reference: 'SW-ref-1',
  wompiId: null,
  customerId: 'cust-1',
  productId: 'prod-1',
  productAmountInCents: 29900000,
  baseFeeInCents: 300000,
  deliveryFeeInCents: 500000,
  amountInCents: 30700000,
  status: 'APPROVED' as const,
  cardLastFour: '1111',
  cardBrand: 'VISA',
  deliveryId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockCustomer = {
  id: 'cust-1',
  name: 'Juan Cardona',
  email: 'juan@example.com',
  phone: '+573001234567',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockDelivery = {
  id: 'del-1',
  transactionId: 'txn-1',
  customerId: 'cust-1',
  recipientName: 'Juan Cardona',
  phone: '+573001234567',
  address: 'Calle 1',
  city: 'Bogotá',
  department: 'Cundinamarca',
  status: 'PENDING' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('admin slice reducers', () => {
  it('clearAdminError sets error to null', () => {
    const store = makeStore();
    store.dispatch({ type: 'admin/fetchProduct/rejected', payload: 'some error' });
    expect(store.getState().admin.error).toBe('some error');

    store.dispatch(clearAdminError());
    expect(store.getState().admin.error).toBeNull();
  });
});

describe('fetchProduct thunk', () => {
  it('sets product on fulfilled', async () => {
    mockedProductsApi.getAll.mockResolvedValue([mockProduct]);
    const store = makeStore();

    await store.dispatch(fetchProduct());

    const state = store.getState().admin;
    expect(state.product).toEqual(mockProduct);
    expect(state.loading).toBe(false);
  });

  it('sets loading=true while pending', () => {
    const store = makeStore();
    store.dispatch({ type: 'admin/fetchProduct/pending' });
    expect(store.getState().admin.loading).toBe(true);
  });

  it('sets error on rejected when no products', async () => {
    mockedProductsApi.getAll.mockResolvedValue([]);
    const store = makeStore();

    await store.dispatch(fetchProduct());

    const state = store.getState().admin;
    expect(state.error).toBe('No product available');
    expect(state.loading).toBe(false);
  });

  it('sets error on network failure', async () => {
    mockedProductsApi.getAll.mockRejectedValue(new Error('Network error'));
    const store = makeStore();

    await store.dispatch(fetchProduct());

    const state = store.getState().admin;
    expect(state.error).toBe('Failed to load product');
    expect(state.loading).toBe(false);
  });

  it('extracts array error message from server response', async () => {
    mockedProductsApi.getAll.mockRejectedValue({
      response: { data: { message: ['field is required', 'other error'] } },
    });
    const store = makeStore();

    await store.dispatch(fetchProduct());

    const state = store.getState().admin;
    expect(state.error).toBe('field is required, other error');
  });

  it('extracts string error message from server response', async () => {
    mockedProductsApi.getAll.mockRejectedValue({
      response: { data: { message: 'Custom server error' } },
    });
    const store = makeStore();

    await store.dispatch(fetchProduct());

    const state = store.getState().admin;
    expect(state.error).toBe('Custom server error');
  });
});

describe('fetchOrders thunk', () => {
  it('sets orders on fulfilled', async () => {
    mockedTransactionsApi.getAll.mockResolvedValue([mockTransaction]);
    mockedCustomersApi.getAll.mockResolvedValue([mockCustomer]);
    mockedDeliveriesApi.getAll.mockResolvedValue([mockDelivery]);
    const store = makeStore();

    await store.dispatch(fetchOrders());

    const state = store.getState().admin;
    expect(state.orders.transactions).toHaveLength(1);
    expect(state.orders.customers).toHaveLength(1);
    expect(state.orders.deliveries).toHaveLength(1);
    expect(state.orders.loading).toBe(false);
  });

  it('sets loading=true while pending', () => {
    const store = makeStore();
    store.dispatch({ type: 'admin/fetchOrders/pending' });
    expect(store.getState().admin.orders.loading).toBe(true);
  });

  it('sets orders.error on rejected', async () => {
    mockedTransactionsApi.getAll.mockRejectedValue(new Error('Network error'));
    const store = makeStore();

    await store.dispatch(fetchOrders());

    const state = store.getState().admin;
    expect(state.orders.error).toBe('Failed to load orders');
    expect(state.orders.loading).toBe(false);
  });
});

describe('updateProduct thunk', () => {
  const updatePayload = {
    id: 'prod-1',
    data: {
      name: 'Updated Watch',
      description: 'updated desc',
      priceInCents: 19900000,
      imageUrls: ['https://img.com/new.png'],
      stock: 5,
    },
  };

  it('sets product on fulfilled', async () => {
    const updatedProduct = { ...mockProduct, name: 'Updated Watch' };
    mockedProductsApi.update.mockResolvedValue(updatedProduct);
    const store = makeStore();

    await store.dispatch(updateProduct(updatePayload));

    const state = store.getState().admin;
    expect(state.product?.name).toBe('Updated Watch');
    expect(state.saving).toBe(false);
  });

  it('sets saving=true while pending', () => {
    const store = makeStore();
    store.dispatch({ type: 'admin/updateProduct/pending' });
    expect(store.getState().admin.saving).toBe(true);
  });

  it('sets error on rejected', async () => {
    mockedProductsApi.update.mockRejectedValue(new Error('Server error'));
    const store = makeStore();

    await store.dispatch(updateProduct(updatePayload));

    const state = store.getState().admin;
    expect(state.error).toBe('Failed to update product');
    expect(state.saving).toBe(false);
  });
});
