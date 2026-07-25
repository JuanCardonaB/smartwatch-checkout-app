import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  Product,
  CustomerForm,
  CardForm,
  DeliveryForm,
  TransactionResult,
  CheckoutStep,
} from '../../types';
import { productsApi, transactionsApi } from '../../services/api';

interface CheckoutState {
  product: Product | null;
  step: CheckoutStep;
  customer: CustomerForm | null;
  card: CardForm | null;
  delivery: DeliveryForm | null;
  transaction: TransactionResult | null;
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY = 'checkout_state';

function loadFromStorage(): Partial<CheckoutState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<CheckoutState>;
    // card is never persisted — sensitive data
    delete parsed.card;
    return parsed;
  } catch {
    return {};
  }
}

function saveToStorage(state: CheckoutState): void {
  try {
    const { card: _card, loading: _loading, error: _error, ...toSave } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // storage quota exceeded — silently ignore
  }
}

const initialState: CheckoutState = {
  product: null,
  step: 1,
  customer: null,
  card: null,
  delivery: null,
  transaction: null,
  loading: false,
  error: null,
  ...loadFromStorage(),
};

export const fetchProduct = createAsyncThunk(
  'checkout/fetchProduct',
  async (_, { rejectWithValue }) => {
    try {
      const products = await productsApi.getAll();
      if (!products.length) return rejectWithValue('No products available');
      return products[0];
    } catch {
      return rejectWithValue('Failed to load product');
    }
  },
);

export const submitPayment = createAsyncThunk(
  'checkout/submitPayment',
  async (_, { getState, rejectWithValue }) => {
    const { checkout } = getState() as { checkout: CheckoutState };
    const { product, customer, card, delivery } = checkout;

    if (!product || !customer || !card || !delivery) {
      return rejectWithValue('Missing checkout data');
    }

    try {
      const result = await transactionsApi.create({
        customer,
        productId: product.id,
        card,
        delivery,
      });
      return result;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(err?.response?.data?.message ?? 'Payment failed');
    }
  },
);

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setStep(state, action: PayloadAction<CheckoutStep>) {
      state.step = action.payload;
      saveToStorage(state);
    },
    setCustomer(state, action: PayloadAction<CustomerForm>) {
      state.customer = action.payload;
      saveToStorage(state);
    },
    setCard(state, action: PayloadAction<CardForm>) {
      // card stays in memory only — not saved to localStorage
      state.card = action.payload;
    },
    setDelivery(state, action: PayloadAction<DeliveryForm>) {
      state.delivery = action.payload;
      saveToStorage(state);
    },
    resetCheckout(state) {
      state.step = 1;
      state.customer = null;
      state.card = null;
      state.delivery = null;
      state.transaction = null;
      state.error = null;
      saveToStorage(state);
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
        saveToStorage(state);
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(submitPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.transaction = action.payload;
        state.step = 4;
        saveToStorage(state);
      })
      .addCase(submitPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.step = 4;
        saveToStorage(state);
      });
  },
});

export const { setStep, setCustomer, setCard, setDelivery, resetCheckout, clearError } =
  checkoutSlice.actions;

export default checkoutSlice.reducer;
