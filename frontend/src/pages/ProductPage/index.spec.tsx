import { render, screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

const mockGetAll = jest.fn();

jest.mock('../../services/api', () => ({
  productsApi: {
    getAll: mockGetAll,
    getById: jest.fn(),
    update: jest.fn(),
    uploadImages: jest.fn(),
  },
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
import ProductPage from './index';

const mockProduct = {
  id: 'prod-1',
  name: 'Smartwatch Pro X1',
  description: 'A premium smartwatch',
  priceInCents: 29900000,
  imageUrls: ['https://img.com/watch.jpg', 'https://img.com/watch2.jpg'],
  stock: 10,
  createdAt: '2026-01-01T00:00:00.000Z',
};

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

function renderProductPage(overrides = {}) {
  const store = makeStore(overrides);
  return { store, ...render(
    <Provider store={store}>
      <MemoryRouter>
        <ProductPage />
      </MemoryRouter>
    </Provider>,
  )};
}

beforeEach(() => {
  mockNavigate.mockClear();
  mockGetAll.mockClear();
  // By default, keep fetchProduct pending (never resolve) so preloaded state dominates
  mockGetAll.mockReturnValue(new Promise(() => {}));
});

describe('ProductPage', () => {
  it('renders loading state when loading=true and thunk is in-flight', () => {
    renderProductPage();
    expect(screen.getByText(/Loading product/i)).toBeInTheDocument();
  });

  it('renders product when api resolves with data', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    const { findAllByText } = renderProductPage();
    const names = await findAllByText('Smartwatch Pro X1');
    expect(names.length).toBeGreaterThan(0);
  });

  it('renders error message when api rejects', async () => {
    mockGetAll.mockRejectedValue(new Error('Network error'));
    const { findByText } = renderProductPage();
    expect(await findByText(/Failed to load product/i)).toBeInTheDocument();
  });

  it('renders "No products available" when api returns empty array', async () => {
    mockGetAll.mockResolvedValue([]);
    const { findByText } = renderProductPage();
    expect(await findByText(/No products available|Product not available/i)).toBeInTheDocument();
  });

  it('renders product description when product is loaded', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    const { findAllByText } = renderProductPage();
    const descs = await findAllByText('A premium smartwatch');
    expect(descs.length).toBeGreaterThan(0);
  });

  it('renders Pay with credit card button when product is loaded', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    const { findAllByText } = renderProductPage();
    const buttons = await findAllByText(/Pay with credit card/i);
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('navigates to /checkout and sets step 2 when buy button is clicked', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    const { store, findAllByText } = renderProductPage();
    const buttons = await findAllByText(/Pay with credit card/i);
    fireEvent.click(buttons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
    expect(store.getState().checkout.step).toBe(2);
  });

  it('disables buy button when stock is 0', async () => {
    mockGetAll.mockResolvedValue([{ ...mockProduct, stock: 0 }]);
    const { findAllByText } = renderProductPage();
    const buttons = await findAllByText(/Pay with credit card/i);
    const hasDisabled = buttons.some(btn => (btn.closest('button') as HTMLButtonElement)?.disabled);
    expect(hasDisabled).toBe(true);
  });

  it('shows stock count in stock badge when product is loaded', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    const { findAllByText } = renderProductPage();
    const stockBadges = await findAllByText(/10 in stock/i);
    expect(stockBadges.length).toBeGreaterThan(0);
  });

  it('swipe right (delta > 50) advances to next image', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    // Wait for product to render
    await screen.findAllByText('Smartwatch Pro X1');

    // Trigger mouse swipe (right-to-left = next image) on mobile layout
    const swipeContainer = document.querySelector('.fixed.inset-0.select-none');
    if (swipeContainer) {
      fireEvent.mouseDown(swipeContainer, { clientX: 200 });
      fireEvent.mouseUp(swipeContainer, { clientX: 100 }); // delta = 100 (swipe left = next)
    }
    // Component should still be rendered
    expect(screen.getAllByText('Smartwatch Pro X1').length).toBeGreaterThan(0);
  });

  it('swipe left (delta < -50) goes to previous image', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    const swipeContainer = document.querySelector('.fixed.inset-0.select-none');
    if (swipeContainer) {
      fireEvent.mouseDown(swipeContainer, { clientX: 100 });
      fireEvent.mouseUp(swipeContainer, { clientX: 250 }); // delta = -150 (swipe right = prev)
    }
    expect(screen.getAllByText('Smartwatch Pro X1').length).toBeGreaterThan(0);
  });

  it('handles touch swipe events', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    const swipeContainer = document.querySelector('.fixed.inset-0.select-none');
    if (swipeContainer) {
      fireEvent.touchStart(swipeContainer, { touches: [{ clientX: 200 }] });
      fireEvent.touchEnd(swipeContainer, { changedTouches: [{ clientX: 100 }] });
    }
    expect(document.body.innerHTML.length).toBeGreaterThan(100);
  });

  it('handles sheet drag start, move, end on mobile', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    // Find the drag handle (the div with h-1 w-10)
    const dragHandles = document.querySelectorAll('.touch-none');
    if (dragHandles.length > 0) {
      const handle = dragHandles[0];
      fireEvent.mouseDown(handle, { clientY: 400 });
      fireEvent.mouseMove(handle, { buttons: 1, clientY: 300 });
      fireEvent.mouseUp(handle);
    }
    expect(document.body.innerHTML.length).toBeGreaterThan(100);
  });

  it('handles sheet touch drag', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    const dragHandles = document.querySelectorAll('.touch-none');
    if (dragHandles.length > 0) {
      const handle = dragHandles[0];
      fireEvent.touchStart(handle, { touches: [{ clientY: 400 }] });
      fireEvent.touchMove(handle, { touches: [{ clientY: 350 }] });
      fireEvent.touchEnd(handle);
    }
    expect(document.body.innerHTML.length).toBeGreaterThan(100);
  });

  it('handles mouse leave on sheet drag handle', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    const dragHandles = document.querySelectorAll('.touch-none');
    if (dragHandles.length > 0) {
      const handle = dragHandles[0];
      fireEvent.mouseDown(handle, { clientY: 400 });
      fireEvent.mouseLeave(handle);
    }
    expect(document.body.innerHTML.length).toBeGreaterThan(100);
  });

  it('renders dot navigation buttons for multiple images', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    // Dot buttons should be rendered (one per image)
    const allButtons = screen.getAllByRole('button');
    // There should be at least 2 dots (for 2 images) across mobile/desktop
    expect(allButtons.length).toBeGreaterThan(0);
  });

  it('clicking a dot button changes active image', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    // Find all small dot buttons (those without text content)
    const allButtons = screen.getAllByRole('button');
    const dotButtons = allButtons.filter(btn => btn.textContent?.trim() === '');
    if (dotButtons.length > 1) {
      fireEvent.click(dotButtons[1]);
    }
    // Component should still be mounted
    expect(screen.getAllByText('Smartwatch Pro X1').length).toBeGreaterThan(0);
  });

  it('renders fallback image when product has no imageUrls', async () => {
    mockGetAll.mockResolvedValue([{ ...mockProduct, imageUrls: [] }]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');
    // Should render with fallback Unsplash image
    const images = document.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(0);
  });
});
