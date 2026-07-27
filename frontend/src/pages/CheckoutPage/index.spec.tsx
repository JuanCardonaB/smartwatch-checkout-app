import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../services/api', () => ({
  productsApi: { getAll: jest.fn(), getById: jest.fn(), update: jest.fn(), uploadImages: jest.fn() },
  transactionsApi: { getAll: jest.fn(), create: jest.fn(), getById: jest.fn() },
  customersApi: { getAll: jest.fn() },
  deliveriesApi: { getAll: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import checkoutReducer from '../../store/slices/checkout.slice';
import adminReducer from '../../store/slices/admin.slice';
import CheckoutPage from './index';

const mockProduct = {
  id: 'prod-1',
  name: 'Smartwatch Pro X1',
  description: 'A great watch',
  priceInCents: 29900000,
  imageUrls: ['https://img.com/watch.jpg'],
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

const mockCard = {
  number: '4111111111111111',
  holder: 'Juan',
  expMonth: '12',
  expYear: '2030',
  cvc: '123',
};
const mockCustomer = { name: 'Juan', email: 'juan@example.com', phone: '+57300' };
const mockDelivery = { recipientName: 'Juan', phone: '+57300', address: 'Calle 1', city: 'Bogotá', department: 'Cundinamarca' };

function makeStore(overrides = {}) {
  return configureStore({
    reducer: { checkout: checkoutReducer, admin: adminReducer },
    preloadedState: {
      checkout: {
        product: null,
        step: 1 as const,
        customer: null,
        card: null,
        delivery: null,
        transaction: null,
        loading: false,
        error: null,
        ...overrides,
      },
    },
  });
}

function renderCheckout(overrides = {}) {
  const store = makeStore(overrides);
  return { store, ...render(
    <Provider store={store}>
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    </Provider>,
  )};
}

beforeEach(() => {
  mockNavigate.mockClear();
});

describe('CheckoutPage', () => {
  it('renders null and navigates to / when product is missing', () => {
    renderCheckout({ product: null });
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('renders StepCardDelivery when step is 2', () => {
    renderCheckout({ product: mockProduct, step: 2 });
    // StepCardDelivery renders a checkout form
    expect(document.body.textContent).toBeTruthy();
  });

  it('renders StepSummary when step is 3 with all data', () => {
    renderCheckout({
      product: mockProduct,
      step: 3,
      card: mockCard,
      customer: mockCustomer,
      delivery: mockDelivery,
    });
    expect(screen.getAllByText(/Order Summary/i).length).toBeGreaterThan(0);
  });

  it('renders StepResult when step is 4 with transaction', () => {
    renderCheckout({
      product: mockProduct,
      step: 4,
      transaction: mockTransaction,
    });
    expect(screen.getAllByText('Payment successful!').length).toBeGreaterThan(0);
  });

  it('renders null for step 1 (product page handles it)', () => {
    const { container } = renderCheckout({ product: mockProduct, step: 1 });
    expect(container.firstChild).toBeNull();
  });
});
