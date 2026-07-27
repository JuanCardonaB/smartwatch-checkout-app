import { configureStore } from '@reduxjs/toolkit';

// Mock the api module BEFORE importing the slice (so import.meta.env never executes)
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

import checkoutReducer, {
  setStep,
  setCustomer,
  setCard,
  setDelivery,
  setTransaction,
  resetCheckout,
  clearError,
  fetchProduct,
  submitPayment,
} from './checkout.slice';
import { productsApi, transactionsApi } from '../../services/api';

const mockedProductsApi = productsApi as jest.Mocked<typeof productsApi>;
const mockedTransactionsApi = transactionsApi as jest.Mocked<typeof transactionsApi>;

// Prevent localStorage from polluting across tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

const makeStore = () =>
  configureStore({
    reducer: { checkout: checkoutReducer },
  });

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
  wompiId: 'wompi-1',
  customerId: 'cust-1',
  productId: 'prod-1',
  productAmountInCents: 29900000,
  baseFeeInCents: 300000,
  deliveryFeeInCents: 500000,
  amountInCents: 30700000,
  status: 'APPROVED' as const,
  cardLastFour: '1111',
  cardBrand: 'VISA',
  deliveryId: 'del-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockCustomer = { name: 'Juan Cardona', email: 'juan@example.com', phone: '+573001234567' };
const mockCard = { number: '4111111111111111', holder: 'Juan Cardona', expMonth: '12', expYear: '2030', cvc: '123' };
const mockDelivery = { recipientName: 'Juan Cardona', phone: '+573001234567', address: 'Calle 1', city: 'Bogotá', department: 'Cundinamarca' };

beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  localStorageMock.getItem.mockReturnValue(null as unknown as string);
});

describe('checkout slice reducers', () => {
  it('setStep updates the step', () => {
    const store = makeStore();
    store.dispatch(setStep(2));
    expect(store.getState().checkout.step).toBe(2);
  });

  it('setCustomer updates customer data', () => {
    const store = makeStore();
    store.dispatch(setCustomer(mockCustomer));
    expect(store.getState().checkout.customer).toEqual(mockCustomer);
  });

  it('setCard stores card in memory only', () => {
    const store = makeStore();
    store.dispatch(setCard(mockCard));
    expect(store.getState().checkout.card).toEqual(mockCard);
  });

  it('setDelivery updates delivery data', () => {
    const store = makeStore();
    store.dispatch(setDelivery(mockDelivery));
    expect(store.getState().checkout.delivery).toEqual(mockDelivery);
  });

  it('setTransaction updates transaction and sets step to 4', () => {
    const store = makeStore();
    store.dispatch(setTransaction(mockTransaction));
    expect(store.getState().checkout.transaction).toEqual(mockTransaction);
    expect(store.getState().checkout.step).toBe(4);
  });

  it('resetCheckout clears all data and returns to step 1', () => {
    const store = makeStore();
    store.dispatch(setStep(3));
    store.dispatch(setCustomer(mockCustomer));
    store.dispatch(setCard(mockCard));
    store.dispatch(setDelivery(mockDelivery));
    store.dispatch(setTransaction(mockTransaction));

    store.dispatch(resetCheckout());

    const state = store.getState().checkout;
    expect(state.step).toBe(1);
    expect(state.customer).toBeNull();
    expect(state.card).toBeNull();
    expect(state.delivery).toBeNull();
    expect(state.transaction).toBeNull();
    expect(state.error).toBeNull();
  });

  it('clearError sets error to null', () => {
    const store = makeStore();
    store.dispatch({ type: 'checkout/fetchProduct/rejected', payload: 'some error' });
    expect(store.getState().checkout.error).toBe('some error');

    store.dispatch(clearError());
    expect(store.getState().checkout.error).toBeNull();
  });
});

describe('fetchProduct thunk', () => {
  it('sets loading=true while pending', () => {
    const store = makeStore();
    store.dispatch({ type: 'checkout/fetchProduct/pending' });
    expect(store.getState().checkout.loading).toBe(true);
    expect(store.getState().checkout.error).toBeNull();
  });

  it('sets product on fulfilled', async () => {
    mockedProductsApi.getAll.mockResolvedValue([mockProduct]);
    const store = makeStore();

    await store.dispatch(fetchProduct());

    const state = store.getState().checkout;
    expect(state.product).toEqual(mockProduct);
    expect(state.loading).toBe(false);
  });

  it('sets error on rejected (no products)', async () => {
    mockedProductsApi.getAll.mockResolvedValue([]);
    const store = makeStore();

    await store.dispatch(fetchProduct());

    const state = store.getState().checkout;
    expect(state.error).toBe('No products available');
    expect(state.loading).toBe(false);
  });

  it('sets error on network failure', async () => {
    mockedProductsApi.getAll.mockRejectedValue(new Error('Network error'));
    const store = makeStore();

    await store.dispatch(fetchProduct());

    const state = store.getState().checkout;
    expect(state.error).toBe('Failed to load product');
    expect(state.loading).toBe(false);
  });
});

describe('submitPayment thunk', () => {
  it('rejects with missing data error when checkout data is incomplete', async () => {
    const store = makeStore();

    await store.dispatch(submitPayment());

    const state = store.getState().checkout;
    expect(state.error).toBe('Missing checkout data');
    expect(state.step).toBe(4);
  });

  it('sets transaction and step 4 on successful payment', async () => {
    const store = makeStore();
    store.dispatch(setCustomer(mockCustomer));
    store.dispatch(setCard(mockCard));
    store.dispatch(setDelivery(mockDelivery));
    store.dispatch({ type: 'checkout/fetchProduct/fulfilled', payload: mockProduct });

    mockedTransactionsApi.create.mockResolvedValue(mockTransaction);

    await store.dispatch(submitPayment());

    const state = store.getState().checkout;
    expect(state.transaction).toEqual(mockTransaction);
    expect(state.step).toBe(4);
    expect(state.loading).toBe(false);
  });

  it('sets error and step 4 on failed payment', async () => {
    const store = makeStore();
    store.dispatch(setCustomer(mockCustomer));
    store.dispatch(setCard(mockCard));
    store.dispatch(setDelivery(mockDelivery));
    store.dispatch({ type: 'checkout/fetchProduct/fulfilled', payload: mockProduct });

    mockedTransactionsApi.create.mockRejectedValue({
      response: { data: { message: 'Payment declined' } },
    });

    await store.dispatch(submitPayment());

    const state = store.getState().checkout;
    expect(state.error).toBe('Payment declined');
    expect(state.step).toBe(4);
    expect(state.loading).toBe(false);
  });

  it('falls back to "Payment failed" when error has no message', async () => {
    const store = makeStore();
    store.dispatch(setCustomer(mockCustomer));
    store.dispatch(setCard(mockCard));
    store.dispatch(setDelivery(mockDelivery));
    store.dispatch({ type: 'checkout/fetchProduct/fulfilled', payload: mockProduct });

    mockedTransactionsApi.create.mockRejectedValue(new Error('Network error'));

    await store.dispatch(submitPayment());

    const state = store.getState().checkout;
    expect(state.error).toBe('Payment failed');
  });

  it('sets loading=true while pending', () => {
    const store = makeStore();
    store.dispatch({ type: 'checkout/submitPayment/pending' });
    expect(store.getState().checkout.loading).toBe(true);
    expect(store.getState().checkout.error).toBeNull();
  });
});
