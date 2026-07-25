import axios from 'axios';
import type { Product, TransactionResult, CardForm, CustomerForm, DeliveryForm } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
});

export const productsApi = {
  getAll: (): Promise<Product[]> =>
    api.get<Product[]>('/products').then((r) => r.data),

  getById: (id: string): Promise<Product> =>
    api.get<Product>(`/products/${id}`).then((r) => r.data),
};

export const transactionsApi = {
  create: (payload: {
    customer: CustomerForm;
    productId: string;
    card: CardForm;
    delivery: DeliveryForm;
  }): Promise<TransactionResult> =>
    api.post<TransactionResult>('/transactions', payload).then((r) => r.data),

  getById: (id: string): Promise<TransactionResult> =>
    api.get<TransactionResult>(`/transactions/${id}`).then((r) => r.data),
};
