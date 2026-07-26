import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Product, Transaction, Customer, Delivery } from "../../types";
import { productsApi, transactionsApi, customersApi, deliveriesApi, type ProductInput } from "../../services/api";

interface AdminState {
  product: Product | null;
  orders: {
    transactions: Transaction[];
    customers: Customer[];
    deliveries: Delivery[];
    loading: boolean;
    error: string | null;
  };
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: AdminState = {
  product: null,
  orders: {
    transactions: [],
    customers: [],
    deliveries: [],
    loading: false,
    error: null,
  },
  loading: false,
  saving: false,
  error: null,
};

function extractError(e: unknown, fallback: string): string {
  const err = e as { response?: { data?: { message?: string | string[] } } };
  const message = err?.response?.data?.message;
  if (Array.isArray(message)) return message.join(", ");
  return message ?? fallback;
}

export const fetchProduct = createAsyncThunk(
  "admin/fetchProduct",
  async (_, { rejectWithValue }) => {
    try {
      const products = await productsApi.getAll();
      if (!products.length) return rejectWithValue("No product available");
      return products[0];
    } catch (e) {
      return rejectWithValue(extractError(e, "Failed to load product"));
    }
  },
);

export const fetchOrders = createAsyncThunk(
  "admin/fetchOrders",
  async (_, { rejectWithValue }) => {
    try {
      const [transactions, customers, deliveries] = await Promise.all([
        transactionsApi.getAll(),
        customersApi.getAll(),
        deliveriesApi.getAll(),
      ]);
      return { transactions, customers, deliveries };
    } catch (e) {
      return rejectWithValue(extractError(e, "Failed to load orders"));
    }
  },
);

export const updateProduct = createAsyncThunk(
  "admin/updateProduct",
  async (
    { id, data }: { id: string; data: ProductInput },
    { rejectWithValue },
  ) => {
    try {
      return await productsApi.update(id, data);
    } catch (e) {
      return rejectWithValue(extractError(e, "Failed to update product"));
    }
  },
);

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearAdminError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.orders.loading = true;
        state.orders.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.orders.loading = false;
        state.orders.transactions = action.payload.transactions;
        state.orders.customers = action.payload.customers;
        state.orders.deliveries = action.payload.deliveries;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.orders.loading = false;
        state.orders.error = action.payload as string;
      })
      .addCase(fetchProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateProduct.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.saving = false;
        state.product = action.payload;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAdminError } = adminSlice.actions;

export default adminSlice.reducer;
