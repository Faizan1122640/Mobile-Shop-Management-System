import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/**
 * Async thunk to fetch all CRM customers
 */
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/crm/customers');
      const json = await response.json();

      if (!response.ok || !json.success) {
        return rejectWithValue(json.message || 'Failed to fetch customers');
      }

      return json.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

/**
 * Async thunk to register a new CRM customer (validated via Zod on backend)
 */
export const addCustomer = createAsyncThunk(
  'customers/addCustomer',
  async (customerPayload, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/crm/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerPayload)
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        return rejectWithValue(json.errors || json.message || 'Validation failed');
      }

      return json.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

/**
 * Redux slice for CRM Customers / Users state management
 */
const customerSlice = createSlice({
  name: 'customers',
  initialState: {
    items: [],
    selectedCustomer: null,
    searchFilter: '',
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null
  },
  reducers: {
    setSelectedCustomer: (state, action) => {
      state.selectedCustomer = action.payload;
    },
    setSearchFilter: (state, action) => {
      state.searchFilter = action.payload;
    },
    clearCustomerError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch customers
      .addCase(fetchCustomers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Add customer
      .addCase(addCustomer.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items.unshift(action.payload);
      })
      .addCase(addCustomer.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { setSelectedCustomer, setSearchFilter, clearCustomerError } = customerSlice.actions;

// Selectors
export const selectAllCustomers = (state) => state.customers.items;
export const selectCustomerStatus = (state) => state.customers.status;
export const selectCustomerError = (state) => state.customers.error;
export const selectFilteredCustomers = (state) => {
  const filter = state.customers.searchFilter.toLowerCase();
  return state.customers.items.filter(
    (c) =>
      c.name.toLowerCase().includes(filter) ||
      (c.phone && c.phone.includes(filter)) ||
      (c.address && c.address.toLowerCase().includes(filter))
  );
};

export default customerSlice.reducer;
