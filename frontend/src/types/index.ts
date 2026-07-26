export interface Product {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  imageUrls: string[];
  stock: number;
  createdAt: string;
}

export interface CustomerForm {
  name: string;
  email: string;
  phone: string;
}

export interface CardForm {
  number: string;
  holder: string;
  expMonth: string;
  expYear: string;
  cvc: string;
}

export interface DeliveryForm {
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  department: string;
}

export interface TransactionResult {
  id: string;
  reference: string;
  wompiId: string | null;
  customerId: string;
  productId: string;
  productAmountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  amountInCents: number;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';
  cardLastFour: string | null;
  cardBrand: string | null;
  deliveryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CheckoutStep = 1 | 2 | 3 | 4;

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface Delivery {
  id: string;
  transactionId: string;
  customerId: string;
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED';
  createdAt: string;
}

export interface Transaction {
  id: string;
  reference: string;
  wompiId: string | null;
  customerId: string;
  productId: string;
  productAmountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  amountInCents: number;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';
  cardLastFour: string | null;
  cardBrand: string | null;
  deliveryId: string | null;
  createdAt: string;
  updatedAt: string;
}
