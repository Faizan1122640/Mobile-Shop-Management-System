import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser as apiLogin, registerUser as apiRegister } from '../../services/api';

// Safe localStorage hydration helper
const getInitialAuthState = () => {
  try {
    const token = localStorage.getItem('cms_token');
    const userJson = localStorage.getItem('cms_user');
    const user = userJson ? JSON.parse(userJson) : null;
    return {
      token: token || null,
      user: user || null,
      isAuthenticated: Boolean(token && user),
      loading: false,
      error: null
    };
  } catch (err) {
    return {
      token: null,
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null
    };
  }
};

export const loginUserThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await apiLogin(email, password);
      if (data.token) {
        localStorage.setItem('cms_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('cms_user', JSON.stringify(data.user));
      }
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Login failed');
    }
  }
);

export const registerUserThunk = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await apiRegister(payload);
      if (data.token) {
        localStorage.setItem('cms_token', data.token);
      }
      if (data.user && data.token) {
        localStorage.setItem('cms_user', JSON.stringify(data.user));
      }
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Registration failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialAuthState(),
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      try {
        localStorage.removeItem('cms_token');
        localStorage.removeItem('cms_user');
      } catch (err) {
        console.error('Error clearing localStorage:', err);
      }
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(state.token && action.payload);
      try {
        localStorage.setItem('cms_user', JSON.stringify(action.payload));
      } catch (err) {
        console.error('Error saving user to localStorage:', err);
      }
    }
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Invalid credentials';
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.token && action.payload.user) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        }
        state.error = null;
      })
      .addCase(registerUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed';
      });
  }
});

export const { logout, clearAuthError, setUser } = authSlice.actions;
export default authSlice.reducer;
