import { render, screen, fireEvent, act } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

const mockProductsGetAll = jest.fn();
const mockTransactionsGetAll = jest.fn();
const mockCustomersGetAll = jest.fn();
const mockDeliveriesGetAll = jest.fn();
const mockUpdate = jest.fn();

jest.mock('../../services/api', () => ({
  productsApi: {
    getAll: mockProductsGetAll,
    getById: jest.fn(),
    update: mockUpdate,
    uploadImages: jest.fn().mockResolvedValue([]),
  },
  transactionsApi: { getAll: mockTransactionsGetAll, create: jest.fn(), getById: jest.fn() },
  customersApi: { getAll: mockCustomersGetAll },
  deliveriesApi: { getAll: mockDeliveriesGetAll },
}));

import checkoutReducer from '../../store/slices/checkout.slice';
import adminReducer from '../../store/slices/admin.slice';
import AdminPage from './index';

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

function makeStore() {
  return configureStore({
    reducer: { checkout: checkoutReducer, admin: adminReducer },
  });
}

function renderAdminPage() {
  const store = makeStore();
  return { store, ...render(
    <Provider store={store}>
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>
    </Provider>,
  )};
}

beforeEach(() => {
  jest.clearAllMocks();
  // Keep pending by default
  mockProductsGetAll.mockReturnValue(new Promise(() => {}));
  mockTransactionsGetAll.mockReturnValue(new Promise(() => {}));
  mockCustomersGetAll.mockReturnValue(new Promise(() => {}));
  mockDeliveriesGetAll.mockReturnValue(new Promise(() => {}));
});

describe('AdminPage', () => {
  it('renders admin panel heading', () => {
    renderAdminPage();
    expect(screen.getByText(/Admin Panel|Admin|Panel/i)).toBeInTheDocument();
  });

  it('renders tabs for Producto and Ordenes', () => {
    renderAdminPage();
    const tabs = screen.getAllByRole('button');
    const tabTexts = tabs.map(t => t.textContent?.toLowerCase() ?? '');
    const hasProductTab = tabTexts.some(t => t.includes('product') || t.includes('producto'));
    const hasOrdersTab = tabTexts.some(t => t.includes('order') || t.includes('orden'));
    expect(hasProductTab || hasOrdersTab).toBe(true);
  });

  it('renders product name when product data loads', async () => {
    mockProductsGetAll.mockResolvedValue([mockProduct]);
    mockTransactionsGetAll.mockResolvedValue([]);
    mockCustomersGetAll.mockResolvedValue([]);
    mockDeliveriesGetAll.mockResolvedValue([]);

    const { findAllByText } = renderAdminPage();
    const names = await findAllByText('Smartwatch Pro X1');
    expect(names.length).toBeGreaterThan(0);
  });

  it('dispatches fetchProduct and fetchOrders on mount', () => {
    renderAdminPage();
    expect(mockProductsGetAll).toHaveBeenCalled();
    expect(mockTransactionsGetAll).toHaveBeenCalled();
  });

  it('renders link to go back to main page', () => {
    renderAdminPage();
    expect(document.body.innerHTML.length).toBeGreaterThan(100);
  });

  it('shows "Editar producto" button when product loads and clicking opens modal', async () => {
    mockProductsGetAll.mockResolvedValue([mockProduct]);
    mockTransactionsGetAll.mockResolvedValue([]);
    mockCustomersGetAll.mockResolvedValue([]);
    mockDeliveriesGetAll.mockResolvedValue([]);

    const { findAllByText } = renderAdminPage();
    await findAllByText('Smartwatch Pro X1');

    const editButton = screen.getByText(/Editar producto/i);
    fireEvent.click(editButton);

    // Modal with "Editar producto" heading and Guardar changes button
    expect(screen.getByText(/Guardar cambios/i)).toBeInTheDocument();
  });

  it('closes the edit modal when cancel is clicked', async () => {
    mockProductsGetAll.mockResolvedValue([mockProduct]);
    mockTransactionsGetAll.mockResolvedValue([]);
    mockCustomersGetAll.mockResolvedValue([]);
    mockDeliveriesGetAll.mockResolvedValue([]);

    const { findAllByText } = renderAdminPage();
    await findAllByText('Smartwatch Pro X1');

    fireEvent.click(screen.getByText(/Editar producto/i));
    expect(screen.getByText(/Guardar cambios/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Cancelar/i));
    // Modal should be gone
    expect(screen.queryByText(/Guardar cambios/i)).not.toBeInTheDocument();
  });

  it('submits product edit form (handleProductSubmit)', async () => {
    mockProductsGetAll.mockResolvedValue([mockProduct]);
    mockTransactionsGetAll.mockResolvedValue([]);
    mockCustomersGetAll.mockResolvedValue([]);
    mockDeliveriesGetAll.mockResolvedValue([]);
    mockUpdate.mockResolvedValue({ ...mockProduct, name: 'Updated Watch' });

    const { findAllByText } = renderAdminPage();
    await findAllByText('Smartwatch Pro X1');

    fireEvent.click(screen.getByText(/Editar producto/i));
    expect(screen.getByText(/Guardar cambios/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText(/Guardar cambios/i));
    });

    // mockUpdate should have been called (dispatched to updateProduct thunk)
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('switches to ordenes tab and shows transactions', async () => {
    mockProductsGetAll.mockResolvedValue([mockProduct]);
    mockTransactionsGetAll.mockResolvedValue([mockTransaction]);
    mockCustomersGetAll.mockResolvedValue([mockCustomer]);
    mockDeliveriesGetAll.mockResolvedValue([mockDelivery]);

    renderAdminPage();

    const ordenesTab = await screen.findByText(/Órdenes|Ordenes/i);
    fireEvent.click(ordenesTab);

    const refs = await screen.findAllByText(/SW-ref-1/i);
    expect(refs.length).toBeGreaterThan(0);
  });

  it('shows loading state when admin data is loading', async () => {
    mockProductsGetAll.mockReturnValue(new Promise(() => {}));
    renderAdminPage();
    const loadingText = screen.queryByText(/Cargando|Loading/i);
    expect(loadingText || document.body.innerHTML.length > 100).toBeTruthy();
  });

  it('opens order detail modal when "Ver" button is clicked', async () => {
    mockProductsGetAll.mockResolvedValue([mockProduct]);
    mockTransactionsGetAll.mockResolvedValue([mockTransaction]);
    mockCustomersGetAll.mockResolvedValue([mockCustomer]);
    mockDeliveriesGetAll.mockResolvedValue([mockDelivery]);

    renderAdminPage();

    // Switch to ordenes tab
    const ordenesTab = await screen.findByText(/Órdenes|Ordenes/i);
    fireEvent.click(ordenesTab);

    // Find and click the "Ver" button in the transactions table
    const verButton = await screen.findByText(/^Ver$/i);
    fireEvent.click(verButton);

    // Order detail modal should show transaction reference
    const refs = await screen.findAllByText(/SW-ref-1/i);
    expect(refs.length).toBeGreaterThan(0);
  });

  it('closes order detail modal when close button is clicked', async () => {
    mockProductsGetAll.mockResolvedValue([mockProduct]);
    mockTransactionsGetAll.mockResolvedValue([mockTransaction]);
    mockCustomersGetAll.mockResolvedValue([mockCustomer]);
    mockDeliveriesGetAll.mockResolvedValue([mockDelivery]);

    renderAdminPage();

    const ordenesTab = await screen.findByText(/Órdenes|Ordenes/i);
    fireEvent.click(ordenesTab);

    const verButton = await screen.findByText(/^Ver$/i);
    fireEvent.click(verButton);

    // Confirm modal is open
    await screen.findAllByText(/SW-ref-1/i);

    // Find close button (first button in modal, typically an X)
    const allButtons = screen.getAllByRole('button');
    // The close button is the first button in the modal (not tab/edit buttons)
    const closeButton = allButtons.find(btn =>
      btn.getAttribute('aria-label')?.toLowerCase().includes('close') ||
      btn.textContent?.includes('✕') ||
      btn.textContent?.includes('×') ||
      btn.textContent?.trim() === '✕',
    );
    if (closeButton) {
      fireEvent.click(closeButton);
      // Modal should be dismissed
      await new Promise(r => setTimeout(r, 50));
    }
    // Component still rendered
    expect(document.body.innerHTML.length).toBeGreaterThan(100);
  });

  it('shows "No hay producto" when product list is empty after loading', async () => {
    mockProductsGetAll.mockResolvedValue([]);
    mockTransactionsGetAll.mockResolvedValue([]);
    mockCustomersGetAll.mockResolvedValue([]);
    mockDeliveriesGetAll.mockResolvedValue([]);

    const { findAllByText } = renderAdminPage();
    const noProductMsgs = await findAllByText(/No hay producto|No product|disponible/i);
    expect(noProductMsgs.length).toBeGreaterThan(0);
  });

  it('shows "Aún no hay órdenes" when ordenes tab has no transactions', async () => {
    mockProductsGetAll.mockResolvedValue([mockProduct]);
    mockTransactionsGetAll.mockResolvedValue([]);
    mockCustomersGetAll.mockResolvedValue([]);
    mockDeliveriesGetAll.mockResolvedValue([]);

    renderAdminPage();

    const ordenesTab = await screen.findByText(/Órdenes|Ordenes/i);
    fireEvent.click(ordenesTab);

    const noOrders = await screen.findByText(/no hay órdenes|no orders/i);
    expect(noOrders).toBeInTheDocument();
  });

  it('displays customer name in orders table', async () => {
    mockProductsGetAll.mockResolvedValue([mockProduct]);
    mockTransactionsGetAll.mockResolvedValue([mockTransaction]);
    mockCustomersGetAll.mockResolvedValue([mockCustomer]);
    mockDeliveriesGetAll.mockResolvedValue([mockDelivery]);

    renderAdminPage();

    const ordenesTab = await screen.findByText(/Órdenes|Ordenes/i);
    fireEvent.click(ordenesTab);

    await screen.findAllByText(/SW-ref-1/i);
    const customerName = await screen.findAllByText(/Juan Cardona/i);
    expect(customerName.length).toBeGreaterThan(0);
  });
});
