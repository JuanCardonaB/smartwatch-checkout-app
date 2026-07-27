import { render, screen } from '@testing-library/react';

jest.mock('./services/api', () => ({
  productsApi: {
    getAll: jest.fn().mockReturnValue(new Promise(() => {})),
    getById: jest.fn(),
    update: jest.fn(),
    uploadImages: jest.fn(),
  },
  transactionsApi: { getAll: jest.fn(), create: jest.fn(), getById: jest.fn() },
  customersApi: { getAll: jest.fn() },
  deliveriesApi: { getAll: jest.fn() },
}));

import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // App should render something (ProductPage shows loading initially)
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('shows loading state on initial mount', () => {
    render(<App />);
    // ProductPage dispatches fetchProduct which sets loading=true
    expect(screen.getByText(/Loading product/i)).toBeInTheDocument();
  });
});
