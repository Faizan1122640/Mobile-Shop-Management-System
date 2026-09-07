import { configureStore } from '@reduxjs/toolkit';
import customerReducer from './slices/customerSlice.js';
import authReducer from './slices/authSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    customers: customerReducer
  },
  devTools: process.env.NODE_ENV !== 'production'
});

export default store;
