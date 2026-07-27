import { render, screen, fireEvent } from '@testing-library/react';
import OrderDetailModal from './OrderDetailModal';

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
  address: 'Calle 1 # 2-3',
  city: 'Bogotá',
  department: 'Cundinamarca',
  status: 'PENDING' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('OrderDetailModal', () => {
  it('renders transaction reference', () => {
    render(
      <OrderDetailModal
        transaction={mockTransaction}
        customer={mockCustomer}
        delivery={mockDelivery}
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByText('SW-ref-1')).toBeInTheDocument();
  });

  it('renders customer name', () => {
    render(
      <OrderDetailModal
        transaction={mockTransaction}
        customer={mockCustomer}
        delivery={mockDelivery}
        onClose={jest.fn()}
      />,
    );
    const names = screen.getAllByText('Juan Cardona');
    expect(names.length).toBeGreaterThan(0);
  });

  it('renders APPROVED status badge', () => {
    render(
      <OrderDetailModal
        transaction={mockTransaction}
        customer={mockCustomer}
        delivery={undefined}
        onClose={jest.fn()}
      />,
    );
    const approvedBadges = screen.getAllByText('APPROVED');
    expect(approvedBadges.length).toBeGreaterThan(0);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <OrderDetailModal
        transaction={mockTransaction}
        customer={mockCustomer}
        delivery={mockDelivery}
        onClose={onClose}
      />,
    );
    // Find close button (X button typically)
    const closeButtons = screen.getAllByRole('button');
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows delivery address when delivery is provided', () => {
    render(
      <OrderDetailModal
        transaction={mockTransaction}
        customer={mockCustomer}
        delivery={mockDelivery}
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByText(/Calle 1/i)).toBeInTheDocument();
  });

  it('renders correctly when customer is undefined', () => {
    render(
      <OrderDetailModal
        transaction={mockTransaction}
        customer={undefined}
        delivery={mockDelivery}
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByText('SW-ref-1')).toBeInTheDocument();
  });

  it('renders PENDING status for delivery', () => {
    render(
      <OrderDetailModal
        transaction={mockTransaction}
        customer={mockCustomer}
        delivery={mockDelivery}
        onClose={jest.fn()}
      />,
    );
    // PENDING appears for delivery status
    const pendingBadges = screen.getAllByText('PENDING');
    expect(pendingBadges.length).toBeGreaterThan(0);
  });

  it('renders different payment statuses correctly', () => {
    const statuses: Array<'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING'> = [
      'DECLINED', 'VOIDED', 'ERROR',
    ];
    statuses.forEach((status) => {
      const { unmount } = render(
        <OrderDetailModal
          transaction={{ ...mockTransaction, status }}
          customer={mockCustomer}
          delivery={undefined}
          onClose={jest.fn()}
        />,
      );
      expect(screen.getByText(status)).toBeInTheDocument();
      unmount();
    });
  });
});
