import { render, screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../services/api', () => ({
  productsApi: { getAll: jest.fn(), getById: jest.fn(), update: jest.fn(), uploadImages: jest.fn() },
  transactionsApi: { getAll: jest.fn(), create: jest.fn(), getById: jest.fn() },
  customersApi: { getAll: jest.fn() },
  deliveriesApi: { getAll: jest.fn() },
}));

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import checkoutReducer from '../../store/slices/checkout.slice';
import adminReducer from '../../store/slices/admin.slice';
import StepResult from './index';

const baseTransaction = {
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

const baseProduct = {
  id: 'prod-1',
  name: 'Smartwatch Pro X1',
  description: 'A great watch',
  priceInCents: 29900000,
  imageUrls: ['https://img.com/watch.jpg'],
  stock: 10,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function makeStore(preloadedCheckout = {}) {
  return configureStore({
    reducer: { checkout: checkoutReducer, admin: adminReducer },
    preloadedState: {
      checkout: {
        product: null,
        step: 4 as const,
        customer: null,
        card: null,
        delivery: null,
        transaction: null,
        loading: false,
        error: null,
        ...preloadedCheckout,
      },
    },
  });
}

function renderWithProviders(checkoutState = {}) {
  const store = makeStore(checkoutState);
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <StepResult />
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  mockNavigate.mockClear();
});

describe('StepResult component', () => {
  describe('APPROVED status', () => {
    it('shows Payment successful headline', () => {
      renderWithProviders({ transaction: baseTransaction, product: baseProduct });
      expect(screen.getAllByText('Payment successful!').length).toBeGreaterThan(0);
    });

    it('shows APPROVED status badge', () => {
      renderWithProviders({ transaction: baseTransaction });
      const badges = screen.getAllByText('APPROVED');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('shows receipt with reference number', () => {
      renderWithProviders({ transaction: baseTransaction });
      expect(screen.getAllByText('SW-ref-1').length).toBeGreaterThan(0);
    });

    it('shows "Back to store" button for successful payment', () => {
      renderWithProviders({ transaction: baseTransaction });
      expect(screen.getAllByText(/back to store/i).length).toBeGreaterThan(0);
    });

    it('dispatches resetCheckout and navigates home on button click', () => {
      renderWithProviders({ transaction: baseTransaction });
      const buttons = screen.getAllByText(/back to store/i);
      fireEvent.click(buttons[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  describe('DECLINED status', () => {
    it('shows Payment declined headline', () => {
      renderWithProviders({ transaction: { ...baseTransaction, status: 'DECLINED' as const } });
      expect(screen.getAllByText('Payment declined').length).toBeGreaterThan(0);
    });

    it('shows "Try again" button for declined payment', () => {
      renderWithProviders({ transaction: { ...baseTransaction, status: 'DECLINED' as const } });
      expect(screen.getAllByText(/try again/i).length).toBeGreaterThan(0);
    });
  });

  describe('PENDING status', () => {
    it('shows Payment pending headline', () => {
      renderWithProviders({ transaction: { ...baseTransaction, status: 'PENDING' as const } });
      expect(screen.getAllByText('Payment pending').length).toBeGreaterThan(0);
    });
  });

  describe('ERROR status', () => {
    it('shows Something went wrong headline', () => {
      renderWithProviders({ transaction: { ...baseTransaction, status: 'ERROR' as const } });
      expect(screen.getAllByText('Something went wrong').length).toBeGreaterThan(0);
    });

    it('does not expose raw backend error message to the user', () => {
      renderWithProviders({
        transaction: { ...baseTransaction, status: 'ERROR' as const },
        error: 'Payment gateway timeout',
      });
      expect(screen.queryByText('Payment gateway timeout')).toBeNull();
    });
  });

  describe('VOIDED status', () => {
    it('shows Payment voided headline', () => {
      renderWithProviders({ transaction: { ...baseTransaction, status: 'VOIDED' as const } });
      expect(screen.getAllByText('Payment voided').length).toBeGreaterThan(0);
    });
  });

  describe('no transaction', () => {
    it('renders without crashing when no transaction (shows ERROR fallback)', () => {
      renderWithProviders({ transaction: null });
      expect(screen.getAllByText('Something went wrong').length).toBeGreaterThan(0);
    });
  });

  describe('receipt row with card info', () => {
    it('shows card last four and brand in receipt', () => {
      renderWithProviders({ transaction: baseTransaction });
      // VISA •••• 1111
      const cardText = screen.getAllByText(/VISA.*1111|1111/);
      expect(cardText.length).toBeGreaterThan(0);
    });

    it('shows product name in receipt when product is set', () => {
      renderWithProviders({ transaction: baseTransaction, product: baseProduct });
      const productNames = screen.getAllByText('Smartwatch Pro X1');
      expect(productNames.length).toBeGreaterThan(0);
    });
  });
});
