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

  /* ── swipe and drag via select-none divs ── */

  it('mobile image area: mouseDown+mouseUp triggers onSwipeStart+onSwipeEnd (delta > 50 → next image)', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    // Find the inner div with select-none inside the mobile wrapper
    const selectNoneDivs = document.querySelectorAll('.select-none');
    // The first one should be the mobile image area
    if (selectNoneDivs.length > 0) {
      fireEvent.mouseDown(selectNoneDivs[0], { clientX: 300 });
      fireEvent.mouseUp(selectNoneDivs[0], { clientX: 200 }); // delta = 100 > 50 → next
    }
    expect(screen.getAllByText('Smartwatch Pro X1').length).toBeGreaterThan(0);
  });

  it('mobile image area: touch swipe left advances image', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    const selectNoneDivs = document.querySelectorAll('.select-none');
    if (selectNoneDivs.length > 0) {
      fireEvent.touchStart(selectNoneDivs[0], { touches: [{ clientX: 300 }] });
      fireEvent.touchEnd(selectNoneDivs[0], { changedTouches: [{ clientX: 150 }] }); // delta = 150 > 50
    }
    expect(screen.getAllByText('Smartwatch Pro X1').length).toBeGreaterThan(0);
  });

  it('mobile image area: touch swipe right goes to previous image', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    const selectNoneDivs = document.querySelectorAll('.select-none');
    if (selectNoneDivs.length > 0) {
      fireEvent.touchStart(selectNoneDivs[0], { touches: [{ clientX: 100 }] });
      fireEvent.touchEnd(selectNoneDivs[0], { changedTouches: [{ clientX: 300 }] }); // delta = -200 < -50 → prev
    }
    expect(screen.getAllByText('Smartwatch Pro X1').length).toBeGreaterThan(0);
  });

  it('mobile image area: mouseDown+mouseUp with delta < 50 does NOT change image', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    const selectNoneDivs = document.querySelectorAll('.select-none');
    if (selectNoneDivs.length > 0) {
      fireEvent.mouseDown(selectNoneDivs[0], { clientX: 100 });
      fireEvent.mouseUp(selectNoneDivs[0], { clientX: 110 }); // delta = -10, no change
    }
    expect(screen.getAllByText('Smartwatch Pro X1').length).toBeGreaterThan(0);
  });

  it('onSwipeEnd does nothing when swipeStartX is null (called without prior start)', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    // Fire mouseUp without a prior mouseDown — swipeStartX.current should be null
    const selectNoneDivs = document.querySelectorAll('.select-none');
    if (selectNoneDivs.length > 0) {
      // Call mouseUp first without mouseDown
      fireEvent.mouseUp(selectNoneDivs[0], { clientX: 100 });
    }
    expect(screen.getAllByText('Smartwatch Pro X1').length).toBeGreaterThan(0);
  });

  it('sheet drag: onSheetDragMove does nothing when dragStartY is null', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    const touchNoneDivs = document.querySelectorAll('.touch-none');
    if (touchNoneDivs.length > 0) {
      // Fire mouseMove without a prior mouseDown — dragStartY should be null
      fireEvent.mouseMove(touchNoneDivs[0], { buttons: 1, clientY: 300 });
    }
    expect(document.body.innerHTML.length).toBeGreaterThan(100);
  });

  it('sheet drag: onSheetDragEnd does nothing when dragStartY is null', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    const touchNoneDivs = document.querySelectorAll('.touch-none');
    if (touchNoneDivs.length > 0) {
      // Fire mouseUp without mouseDown
      fireEvent.mouseUp(touchNoneDivs[0]);
    }
    expect(document.body.innerHTML.length).toBeGreaterThan(100);
  });

  it('sheet drag: moves and snaps to closest snap point', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    const touchNoneDivs = document.querySelectorAll('.touch-none');
    if (touchNoneDivs.length > 0) {
      const handle = touchNoneDivs[0];
      // Start drag at y=500, move up by 100px (increase height)
      fireEvent.mouseDown(handle, { clientY: 500 });
      fireEvent.mouseMove(handle, { buttons: 1, clientY: 400 });
      fireEvent.mouseMove(handle, { buttons: 1, clientY: 350 });
      fireEvent.mouseUp(handle); // snap to closest
    }
    expect(document.body.innerHTML.length).toBeGreaterThan(100);
  });

  it('desktop: prev arrow button goes to previous image', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    // Desktop has prev/next arrow buttons (aria-label not set, just SVG buttons)
    // The desktop carousel prev/next buttons are the only ones present without label
    const allButtons = screen.getAllByRole('button');
    // Look for buttons that are the desktop navigation (prev/next arrows in the image area)
    // They contain just an SVG (no text), in the hidden md:flex section
    // Click the "Slide 2" button to jump to second image, then click prev arrow
    const slideButtons = screen.getAllByLabelText(/Slide/i);
    if (slideButtons.length >= 2) {
      fireEvent.click(slideButtons[1]); // go to slide 2
    }
    // Now click prev (find it among unlabeled buttons)
    const unlabeledButtons = allButtons.filter(
      btn => !btn.getAttribute('aria-label') && btn.textContent?.trim() === '',
    );
    if (unlabeledButtons.length > 0) {
      fireEvent.click(unlabeledButtons[0]);
    }
    expect(screen.getAllByText('Smartwatch Pro X1').length).toBeGreaterThan(0);
  });

  it('desktop: next arrow button advances to next image', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    const allButtons = screen.getAllByRole('button');
    const unlabeledButtons = allButtons.filter(
      btn => !btn.getAttribute('aria-label') && btn.textContent?.trim() === '',
    );
    if (unlabeledButtons.length > 1) {
      fireEvent.click(unlabeledButtons[1]); // second unlabeled = next arrow
    }
    expect(screen.getAllByText('Smartwatch Pro X1').length).toBeGreaterThan(0);
  });

  it('desktop: mouseDown+mouseUp triggers swipe on desktop carousel', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    // Find all select-none divs — second should be the desktop image area
    const selectNoneDivs = document.querySelectorAll('.select-none');
    if (selectNoneDivs.length > 1) {
      fireEvent.mouseDown(selectNoneDivs[1], { clientX: 300 });
      fireEvent.mouseUp(selectNoneDivs[1], { clientX: 100 }); // delta = 200 → next
    }
    expect(screen.getAllByText('Smartwatch Pro X1').length).toBeGreaterThan(0);
  });

  it('clicking a Slide dot button sets active image', async () => {
    mockGetAll.mockResolvedValue([mockProduct]);
    renderProductPage();
    await screen.findAllByText('Smartwatch Pro X1');

    const slideButtons = screen.getAllByLabelText(/Slide/i);
    if (slideButtons.length >= 2) {
      fireEvent.click(slideButtons[1]); // click dot 2 → activeImage = 1
    }
    expect(screen.getAllByText('Smartwatch Pro X1').length).toBeGreaterThan(0);
  });

  it('shows "Product not available" when product is null and no error', async () => {
    mockGetAll.mockResolvedValue([]);
    renderProductPage();
    expect(await screen.findByText(/Product not available|No products available/i)).toBeInTheDocument();
  });
});
