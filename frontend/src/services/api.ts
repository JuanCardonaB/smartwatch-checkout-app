import axios from 'axios';
import type { Product, Transaction, Customer, Delivery, TransactionResult, CardForm, CustomerForm, DeliveryForm } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
});

export interface ProductInput {
  name: string;
  description: string;
  priceInCents: number;
  imageUrls: string[];
  stock: number;
}

export const productsApi = {
  getAll: (): Promise<Product[]> =>
    api.get<Product[]>('/products').then((r) => r.data),

  getById: (id: string): Promise<Product> =>
    api.get<Product>(`/products/${id}`).then((r) => r.data),

  update: (id: string, payload: ProductInput): Promise<Product> =>
    api.put<Product>(`/products/${id}`, payload).then((r) => r.data),

  uploadImages: (files: File[]): Promise<string[]> => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    return api
      .post<{ urls: string[] }>('/products/images', form)
      .then((r) => r.data.urls);
  },
};

export const transactionsApi = {
  getAll: (): Promise<Transaction[]> =>
    api.get<Transaction[]>('/transactions').then((r) => r.data),

  create: (payload: {
    customer: CustomerForm;
    productId: string;
    card: CardForm;
    delivery: DeliveryForm;
  }): Promise<TransactionResult> => {
    const stripSpaces = (s: string) => s.replace(/\s/g, '');
    const body = {
      customer: {
        ...payload.customer,
        phone: stripSpaces(payload.customer.phone),
      },
      productId: payload.productId,
      card: {
        ...payload.card,
        number: stripSpaces(payload.card.number),
        expMonth: payload.card.expMonth.padStart(2, '0'),
        expYear: payload.card.expYear.length === 2 ? `20${payload.card.expYear}` : payload.card.expYear,
      },
      delivery: {
        ...payload.delivery,
        phone: stripSpaces(payload.delivery.phone),
      },
    };
    return api.post<TransactionResult>('/transactions', body).then((r) => r.data);
  },

  getById: (id: string): Promise<TransactionResult> =>
    api.get<TransactionResult>(`/transactions/${id}`).then((r) => r.data),
};

export const customersApi = {
  getAll: (): Promise<Customer[]> =>
    api.get<Customer[]>('/customers').then((r) => r.data),
};

export const deliveriesApi = {
  getAll: (): Promise<Delivery[]> =>
    api.get<Delivery[]>('/deliveries').then((r) => r.data),
};
