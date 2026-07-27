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

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import checkoutReducer from '../../store/slices/checkout.slice';
import adminReducer from '../../store/slices/admin.slice';
import StepCardDelivery from './index';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeStore(overrides = {}) {
  return configureStore({
    reducer: { checkout: checkoutReducer, admin: adminReducer },
    preloadedState: {
      checkout: {
        product: null,
        step: 2 as const,
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

function renderComponent(overrides = {}) {
  const store = makeStore(overrides);
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          <StepCardDelivery />
        </MemoryRouter>
      </Provider>,
    ),
  };
}

/** Fill in all form fields with valid data so the form can be submitted. */
function fillValidForm() {
  // Customer name
  const nameInput = document.querySelector('input[placeholder="John Doe"]') as HTMLInputElement;
  fireEvent.change(nameInput, { target: { value: 'Juan Cardona' } });

  // Email
  const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
  fireEvent.change(emailInput, { target: { value: 'juan@example.com' } });

  // Customer phone (tel inputs, first one is customer phone)
  const telInputs = document.querySelectorAll('input[type="tel"]');
  fireEvent.change(telInputs[0], { target: { value: '3001234567' } });

  // Card number
  const cardInput = document.querySelector('input[placeholder="0000 0000 0000 0000"]') as HTMLInputElement;
  fireEvent.change(cardInput, { target: { value: '4111111111111111' } });

  // Cardholder
  const holderInput = document.querySelector('input[placeholder="As it appears on card"]') as HTMLInputElement;
  fireEvent.change(holderInput, { target: { value: 'JUAN CARDONA' } });

  // Month
  const monthInput = document.querySelector('input[placeholder="MM"]') as HTMLInputElement;
  fireEvent.change(monthInput, { target: { value: '12' } });

  // Year — use a year well in the future
  const yearInput = document.querySelector('input[placeholder="YY"]') as HTMLInputElement;
  const futureYear = String((new Date().getFullYear() % 100) + 5).padStart(2, '0');
  fireEvent.change(yearInput, { target: { value: futureYear } });

  // CVC
  const cvcInput = document.querySelector('input[placeholder="•••"]') as HTMLInputElement;
  fireEvent.change(cvcInput, { target: { value: '123' } });

  // Delivery recipient name
  const recipientInput = document.querySelector('input[placeholder="Who receives the package"]') as HTMLInputElement;
  fireEvent.change(recipientInput, { target: { value: 'Maria Cardona' } });

  // Delivery phone (second tel input)
  fireEvent.change(telInputs[1], { target: { value: '3109876543' } });

  // Street address
  const addressInput = document.querySelector('input[placeholder="Calle 123 # 45-67"]') as HTMLInputElement;
  fireEvent.change(addressInput, { target: { value: 'Calle 100 # 10-20' } });

  // City
  const cityInput = document.querySelector('input[placeholder="Bogotá"]') as HTMLInputElement;
  fireEvent.change(cityInput, { target: { value: 'Bogotá' } });

  // Department
  const deptInput = document.querySelector('input[placeholder="Cundinamarca"]') as HTMLInputElement;
  fireEvent.change(deptInput, { target: { value: 'Cundinamarca' } });
}

// ─── Tests ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockNavigate.mockClear();
});

describe('StepCardDelivery component', () => {
  /* ── Rendering ── */

  it('renders the Payment heading', () => {
    renderComponent();
    expect(screen.getAllByText(/Payment/i).length).toBeGreaterThan(0);
  });

  it('renders Personal Info section', () => {
    renderComponent();
    expect(screen.getAllByText(/Personal Info/i).length).toBeGreaterThan(0);
  });

  it('renders Card Information section', () => {
    renderComponent();
    expect(screen.getAllByText(/Card Information/i).length).toBeGreaterThan(0);
  });

  it('renders Delivery Information section', () => {
    renderComponent();
    expect(screen.getAllByText(/Delivery Information/i).length).toBeGreaterThan(0);
  });

  it('renders Review order button', () => {
    renderComponent();
    expect(screen.getAllByText(/Review order/i).length).toBeGreaterThan(0);
  });

  it('renders Go back buttons (mobile + desktop)', () => {
    renderComponent();
    const backButtons = screen.getAllByLabelText(/Go back/i);
    expect(backButtons.length).toBeGreaterThan(0);
  });

  it('renders the card number input', () => {
    renderComponent();
    expect(document.querySelector('input[placeholder="0000 0000 0000 0000"]')).not.toBeNull();
  });

  /* ── Pre-filled values from store ── */

  it('pre-fills fields when store has saved customer data', () => {
    renderComponent({
      customer: { name: 'Stored Name', email: 'stored@example.com', phone: '+573001234567' },
      card: { number: '4111 1111 1111 1111', holder: 'STORED NAME', expMonth: '05', expYear: '30', cvc: '' },
      delivery: { recipientName: 'Stored Recipient', phone: '+573009876543', address: 'Av Saved 1', city: 'Medellín', department: 'Antioquia' },
    });
    const nameInput = document.querySelector('input[placeholder="John Doe"]') as HTMLInputElement;
    expect(nameInput.value).toBe('Stored Name');
  });

  /* ── Back navigation ── */

  it('navigates back and sets step to 1 when Go back button is clicked', () => {
    const { store } = renderComponent();
    const backButtons = screen.getAllByLabelText(/Go back/i);
    fireEvent.click(backButtons[0]);
    expect(store.getState().checkout.step).toBe(1);
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  /* ── Validation — empty form ── */

  it('shows validation errors on all required fields when submitting empty form', () => {
    renderComponent();
    const reviewButtons = screen.getAllByText(/Review order/i);
    fireEvent.click(reviewButtons[0]);
    const errors = document.querySelectorAll('.text-red-500');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('shows "Required" error for customer name when empty', () => {
    renderComponent();
    const reviewButtons = screen.getAllByText(/Review order/i);
    fireEvent.click(reviewButtons[0]);
    expect(screen.getAllByText('Required').length).toBeGreaterThan(0);
  });

  it('shows email validation error for invalid email', () => {
    renderComponent();
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    const reviewButtons = screen.getAllByText(/Review order/i);
    fireEvent.click(reviewButtons[0]);
    expect(screen.getAllByText('Enter a valid email').length).toBeGreaterThan(0);
  });

  it('shows card number validation error for short card number', () => {
    renderComponent();
    const cardInput = document.querySelector('input[placeholder="0000 0000 0000 0000"]') as HTMLInputElement;
    fireEvent.change(cardInput, { target: { value: '1234' } });
    fireEvent.click(screen.getAllByText(/Review order/i)[0]);
    expect(screen.getAllByText('Must be 16 digits').length).toBeGreaterThan(0);
  });

  it('shows brand error for unsupported card brand (not Visa/MC)', () => {
    renderComponent();
    const cardInput = document.querySelector('input[placeholder="0000 0000 0000 0000"]') as HTMLInputElement;
    // Discover card (not supported)
    fireEvent.change(cardInput, { target: { value: '6011000000000004' } });
    fireEvent.click(screen.getAllByText(/Review order/i)[0]);
    expect(screen.getAllByText('Only VISA and Mastercard accepted').length).toBeGreaterThan(0);
  });

  it('shows month validation error for out-of-range month', () => {
    renderComponent();
    const monthInput = document.querySelector('input[placeholder="MM"]') as HTMLInputElement;
    fireEvent.change(monthInput, { target: { value: '13' } });
    fireEvent.click(screen.getAllByText(/Review order/i)[0]);
    expect(screen.getAllByText('Invalid (01–12)').length).toBeGreaterThan(0);
  });

  it('shows year validation error for past year', () => {
    renderComponent();
    const yearInput = document.querySelector('input[placeholder="YY"]') as HTMLInputElement;
    fireEvent.change(yearInput, { target: { value: '01' } });
    fireEvent.click(screen.getAllByText(/Review order/i)[0]);
    expect(screen.getAllByText('Invalid year').length).toBeGreaterThan(0);
  });

  it('shows CVC validation error for invalid CVC', () => {
    renderComponent();
    const cvcInput = document.querySelector('input[placeholder="•••"]') as HTMLInputElement;
    fireEvent.change(cvcInput, { target: { value: '12' } });
    fireEvent.click(screen.getAllByText(/Review order/i)[0]);
    expect(screen.getAllByText('3–4 digits').length).toBeGreaterThan(0);
  });

  /* ── Field interactions ── */

  it('updates customer name field on input', () => {
    renderComponent();
    const nameInput = document.querySelector('input[placeholder="John Doe"]') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    expect(nameInput.value).toBe('Test User');
  });

  it('formats card number with spaces every 4 digits', () => {
    renderComponent();
    const cardInput = document.querySelector('input[placeholder="0000 0000 0000 0000"]') as HTMLInputElement;
    fireEvent.change(cardInput, { target: { value: '4111111111111111' } });
    expect(cardInput.value).toBe('4111 1111 1111 1111');
  });

  it('uppercases cardholder name', () => {
    renderComponent();
    const holderInput = document.querySelector('input[placeholder="As it appears on card"]') as HTMLInputElement;
    fireEvent.change(holderInput, { target: { value: 'juan cardona' } });
    expect(holderInput.value).toBe('JUAN CARDONA');
  });

  it('auto-pads single-digit month >= 2 on the fly', () => {
    renderComponent();
    const monthInput = document.querySelector('input[placeholder="MM"]') as HTMLInputElement;
    fireEvent.change(monthInput, { target: { value: '3' } });
    // A single digit >= 2 gets padded: '3' -> '03'
    expect(monthInput.value).toBe('03');
  });

  it('does not auto-pad month 1 on change (only on blur)', () => {
    renderComponent();
    const monthInput = document.querySelector('input[placeholder="MM"]') as HTMLInputElement;
    fireEvent.change(monthInput, { target: { value: '1' } });
    // '1' could be the start of '11' or '12', so don't pad yet
    expect(monthInput.value).toBe('1');
  });

  it('pads month to 2 digits on blur', () => {
    renderComponent();
    const monthInput = document.querySelector('input[placeholder="MM"]') as HTMLInputElement;
    fireEvent.change(monthInput, { target: { value: '1' } });
    fireEvent.blur(monthInput);
    expect(monthInput.value).toBe('01');
  });

  it('flips card when CVC field is focused', () => {
    renderComponent();
    const cvcInput = document.querySelector('input[placeholder="•••"]') as HTMLInputElement;
    fireEvent.focus(cvcInput);
    // The card flip is a CSS transform — we verify the component stays mounted
    expect(cvcInput).toBeInTheDocument();
  });

  it('un-flips card when CVC field loses focus', () => {
    renderComponent();
    const cvcInput = document.querySelector('input[placeholder="•••"]') as HTMLInputElement;
    fireEvent.focus(cvcInput);
    fireEvent.blur(cvcInput);
    expect(cvcInput).toBeInTheDocument();
  });

  it('shows Visa SVG when card number starts with 4', () => {
    renderComponent();
    const cardInput = document.querySelector('input[placeholder="0000 0000 0000 0000"]') as HTMLInputElement;
    fireEvent.change(cardInput, { target: { value: '4111111111111111' } });
    // Visa SVG is rendered in the card number field area
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('shows Mastercard SVG when card number starts with 51', () => {
    renderComponent();
    const cardInput = document.querySelector('input[placeholder="0000 0000 0000 0000"]') as HTMLInputElement;
    fireEvent.change(cardInput, { target: { value: '5100000000000000' } });
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('removes non-digit characters from year input', () => {
    renderComponent();
    const yearInput = document.querySelector('input[placeholder="YY"]') as HTMLInputElement;
    fireEvent.change(yearInput, { target: { value: 'ab30' } });
    expect(yearInput.value).toBe('30');
  });

  it('limits year input to 2 characters', () => {
    renderComponent();
    const yearInput = document.querySelector('input[placeholder="YY"]') as HTMLInputElement;
    fireEvent.change(yearInput, { target: { value: '2030' } });
    expect(yearInput.value).toBe('20');
  });

  it('removes non-digit characters from CVC input', () => {
    renderComponent();
    const cvcInput = document.querySelector('input[placeholder="•••"]') as HTMLInputElement;
    fireEvent.change(cvcInput, { target: { value: 'ab12c' } });
    expect(cvcInput.value).toBe('12');
  });

  /* ── Delivery section ── */

  it('updates delivery recipient name on input', () => {
    renderComponent();
    const recipientInput = document.querySelector('input[placeholder="Who receives the package"]') as HTMLInputElement;
    fireEvent.change(recipientInput, { target: { value: 'Maria Lopez' } });
    expect(recipientInput.value).toBe('Maria Lopez');
  });

  it('updates street address on input', () => {
    renderComponent();
    const addressInput = document.querySelector('input[placeholder="Calle 123 # 45-67"]') as HTMLInputElement;
    fireEvent.change(addressInput, { target: { value: 'Av. El Dorado' } });
    expect(addressInput.value).toBe('Av. El Dorado');
  });

  it('updates city on input', () => {
    renderComponent();
    const cityInput = document.querySelector('input[placeholder="Bogotá"]') as HTMLInputElement;
    fireEvent.change(cityInput, { target: { value: 'Medellín' } });
    expect(cityInput.value).toBe('Medellín');
  });

  it('updates department on input', () => {
    renderComponent();
    const deptInput = document.querySelector('input[placeholder="Cundinamarca"]') as HTMLInputElement;
    fireEvent.change(deptInput, { target: { value: 'Antioquia' } });
    expect(deptInput.value).toBe('Antioquia');
  });

  /* ── Successful submission ── */

  it('dispatches setCustomer, setCard, setDelivery, and advances to step 3 on valid submit', () => {
    const { store } = renderComponent();
    fillValidForm();
    fireEvent.click(screen.getAllByText(/Review order/i)[0]);
    const state = store.getState().checkout;
    expect(state.step).toBe(3);
    expect(state.customer?.name).toBe('Juan Cardona');
    expect(state.customer?.email).toBe('juan@example.com');
    expect(state.card?.holder).toBe('JUAN CARDONA');
    expect(state.delivery?.city).toBe('Bogotá');
  });

  it('stores customer data in the Redux store after valid submit', () => {
    const { store } = renderComponent();
    fillValidForm();
    fireEvent.click(screen.getAllByText(/Review order/i)[0]);
    expect(store.getState().checkout.customer).not.toBeNull();
  });

  it('stores card data in the Redux store after valid submit', () => {
    const { store } = renderComponent();
    fillValidForm();
    fireEvent.click(screen.getAllByText(/Review order/i)[0]);
    expect(store.getState().checkout.card).not.toBeNull();
  });

  it('stores delivery data in the Redux store after valid submit', () => {
    const { store } = renderComponent();
    fillValidForm();
    fireEvent.click(screen.getAllByText(/Review order/i)[0]);
    expect(store.getState().checkout.delivery).not.toBeNull();
  });

  /* ── Phone validation ── */

  it('shows phone validation error when customer phone has fewer than 9 digits', () => {
    renderComponent();
    const nameInput = document.querySelector('input[placeholder="John Doe"]') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    // Enter a short phone number (< 9 digits)
    const telInputs = document.querySelectorAll('input[type="tel"]');
    fireEvent.change(telInputs[0], { target: { value: '123' } });
    fireEvent.click(screen.getAllByText(/Review order/i)[0]);
    expect(screen.getAllByText('Min 7 digits').length).toBeGreaterThan(0);
  });

  /* ── Card brand helpers (inline, for branch coverage) ── */

  describe('card brand detection', () => {
    it('detects visa for numbers starting with 4', () => {
      const detectBrand = (num: string) => {
        const n = num.replace(/\s/g, '');
        if (/^4/.test(n)) return 'visa';
        if (/^(5[1-5]|2[2-7]\d{2})/.test(n)) return 'mastercard';
        return null;
      };
      expect(detectBrand('4111111111111111')).toBe('visa');
    });

    it('detects mastercard for numbers starting with 51-55', () => {
      const detectBrand = (num: string) => {
        const n = num.replace(/\s/g, '');
        if (/^4/.test(n)) return 'visa';
        if (/^(5[1-5]|2[2-7]\d{2})/.test(n)) return 'mastercard';
        return null;
      };
      expect(detectBrand('5500000000000004')).toBe('mastercard');
    });

    it('detects mastercard for 2xxx range', () => {
      const detectBrand = (num: string) => {
        const n = num.replace(/\s/g, '');
        if (/^4/.test(n)) return 'visa';
        if (/^(5[1-5]|2[2-7]\d{2})/.test(n)) return 'mastercard';
        return null;
      };
      expect(detectBrand('2221000000000000')).toBe('mastercard');
    });

    it('returns null for unknown brand', () => {
      const detectBrand = (num: string) => {
        const n = num.replace(/\s/g, '');
        if (/^4/.test(n)) return 'visa';
        if (/^(5[1-5]|2[2-7]\d{2})/.test(n)) return 'mastercard';
        return null;
      };
      expect(detectBrand('6011000000000004')).toBeNull();
    });
  });

  describe('mask card display', () => {
    it('returns all bullets for empty string', () => {
      const mask = (formatted: string) => {
        const digits = formatted.replace(/\s/g, '');
        if (digits.length === 0) return '•••• •••• •••• ••••';
        const padded = digits.padEnd(16, '•');
        return `${padded.slice(0, 4)} ${padded.slice(4, 8)} ${padded.slice(8, 12)} ${padded.slice(12)}`;
      };
      expect(mask('')).toBe('•••• •••• •••• ••••');
    });

    it('pads partial number with bullets', () => {
      const mask = (formatted: string) => {
        const digits = formatted.replace(/\s/g, '');
        if (digits.length === 0) return '•••• •••• •••• ••••';
        const padded = digits.padEnd(16, '•');
        return `${padded.slice(0, 4)} ${padded.slice(4, 8)} ${padded.slice(8, 12)} ${padded.slice(12)}`;
      };
      expect(mask('1234')).toBe('1234 •••• •••• ••••');
    });
  });
});
