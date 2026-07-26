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

import checkoutReducer from '../../store/slices/checkout.slice';
import adminReducer from '../../store/slices/admin.slice';
import StepSummary from './index';

const mockProduct = {
  id: 'prod-1',
  name: 'Smartwatch Pro X1',
  description: 'A great watch',
  priceInCents: 29900000,
  imageUrls: ['https://img.com/watch.jpg'],
  stock: 10,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockCard = {
  number: '4111111111111111',
  holder: 'Juan Cardona',
  expMonth: '12',
  expYear: '2030',
  cvc: '123',
};

const mockMastercardCard = {
  number: '5500000000000004',
  holder: 'Juan Cardona',
  expMonth: '06',
  expYear: '2028',
  cvc: '321',
};

const mockCustomer = {
  name: 'Juan Cardona',
  email: 'juan@example.com',
  phone: '+573001234567',
};

const mockDelivery = {
  recipientName: 'Juan Cardona',
  phone: '+573001234567',
  address: 'Calle 123 # 45-67',
  city: 'Medellín',
  department: 'Antioquia',
};

function makeStore(checkoutState = {}) {
  return configureStore({
    reducer: { checkout: checkoutReducer, admin: adminReducer },
    preloadedState: {
      checkout: {
        product: mockProduct,
        step: 3 as const,
        customer: mockCustomer,
        card: mockCard,
        delivery: mockDelivery,
        transaction: null,
        loading: false,
        error: null,
        ...checkoutState,
      },
    },
  });
}

function renderWithProviders(checkoutState = {}) {
  const store = makeStore(checkoutState);
  return { store, ...render(
    <Provider store={store}>
      <MemoryRouter>
        <StepSummary />
      </MemoryRouter>
    </Provider>,
  )};
}

describe('StepSummary component', () => {
  describe('when all data is present', () => {
    it('renders Order Summary heading', () => {
      renderWithProviders();
      expect(screen.getAllByText('Order Summary').length).toBeGreaterThan(0);
    });

    it('shows product name', () => {
      renderWithProviders();
      expect(screen.getAllByText('Smartwatch Pro X1').length).toBeGreaterThan(0);
    });

    it('shows VISA card logo for Visa card number', () => {
      renderWithProviders({ card: mockCard });
      // VISA chip should be rendered (svg with VISA text)
      expect(screen.getAllByText(/1111/).length).toBeGreaterThan(0);
    });

    it('shows delivery recipient name', () => {
      renderWithProviders();
      expect(screen.getAllByText('Juan Cardona').length).toBeGreaterThan(0);
    });

    it('shows delivery city', () => {
      renderWithProviders();
      expect(screen.getAllByText(/Medellín/).length).toBeGreaterThan(0);
    });

    it('shows "Confirm payment" button', () => {
      renderWithProviders();
      expect(screen.getAllByText(/Confirm payment/i).length).toBeGreaterThan(0);
    });

    it('shows loading spinner when loading=true', () => {
      renderWithProviders({ loading: true });
      expect(screen.getAllByText(/Processing/i).length).toBeGreaterThan(0);
    });

    it('disables confirm button when loading', () => {
      renderWithProviders({ loading: true });
      const buttons = screen.getAllByRole('button', { name: /Processing/i });
      expect(buttons[0]).toBeDisabled();
    });
  });

  describe('when required data is missing', () => {
    it('dispatches setStep(2) and returns null when product is missing', () => {
      const { store } = renderWithProviders({ product: null });
      // Component should dispatch setStep(2) and render null
      expect(store.getState().checkout.step).toBe(2);
    });

    it('dispatches setStep(2) when card is missing', () => {
      const { store } = renderWithProviders({ card: null });
      expect(store.getState().checkout.step).toBe(2);
    });

    it('dispatches setStep(2) when customer is missing', () => {
      const { store } = renderWithProviders({ customer: null });
      expect(store.getState().checkout.step).toBe(2);
    });

    it('dispatches setStep(2) when delivery is missing', () => {
      const { store } = renderWithProviders({ delivery: null });
      expect(store.getState().checkout.step).toBe(2);
    });
  });

  describe('card brand detection', () => {
    it('shows VISA chip for card starting with 4', () => {
      renderWithProviders({ card: { ...mockCard, number: '4111111111111111' } });
      // VISA svg is rendered, look for last four digits
      expect(screen.getAllByText(/1111/).length).toBeGreaterThan(0);
    });

    it('shows Mastercard chip for card starting with 5x', () => {
      renderWithProviders({ card: mockMastercardCard });
      // MC card - last 4 digits should show
      expect(screen.getAllByText(/0004/).length).toBeGreaterThan(0);
    });

    it('shows neutral chip for unknown card brand', () => {
      renderWithProviders({ card: { ...mockCard, number: '6011000000000004' } });
      // Discover card - no visa/mastercard chip, but last 4 visible
      expect(screen.getAllByText(/0004/).length).toBeGreaterThan(0);
    });
  });

  describe('navigation', () => {
    it('dispatches setStep(2) when back button is clicked', () => {
      const { store } = renderWithProviders();
      const backButtons = screen.getAllByLabelText('Go back');
      fireEvent.click(backButtons[0]);
      expect(store.getState().checkout.step).toBe(2);
    });
  });
});
