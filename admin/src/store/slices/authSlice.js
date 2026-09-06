import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../services/api';

// Initial state
const initialState = {
  admin: null,
  token: localStorage.getItem('adminToken'),
  loading: false,
  error: null,
  isAuthenticated: false,
};

// Async thunk for login
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await adminAPI.login(credentials);
      const { admin, token } = response.data.data;

      // ✅ Save to localStorage (including role)
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminData', JSON.stringify(admin));
      localStorage.setItem('adminRole', admin.role); // ✅ Save role separately for easy access

      return { admin, token };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed'
      );
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.admin = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      localStorage.removeItem('adminRole'); // ✅ Clear role
    },
    loadAdmin: (state) => {
      const token = localStorage.getItem('adminToken');
      const adminData = localStorage.getItem('adminData');

      if (token && adminData) {
        state.token = token;
        state.admin = JSON.parse(adminData);
        state.isAuthenticated = true;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.admin = action.payload.admin;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, loadAdmin, clearError } = authSlice.actions;
export default authSlice.reducer;
