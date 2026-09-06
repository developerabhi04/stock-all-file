import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../services/api';

const initialState = {
  payments: undefined,
  totalPages: 0,
  currentPage: 1,
  totalPending: 0,
  loading: false,
  actionLoading: null,
  error: null,
};

// Fetch pending payments
export const fetchPendingPayments = createAsyncThunk(
  'payments/fetchPending',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getPendingPayments(page, limit);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch payments'
      );
    }
  }
);

// Approve payment
export const approvePayment = createAsyncThunk(
  'payments/approve',
  async ({ transactionId, verificationNote }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.approvePayment({
        transactionId,
        verificationNote,
      });
      return { transactionId, data: response.data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to approve payment'
      );
    }
  }
);

// Reject payment
export const rejectPayment = createAsyncThunk(
  'payments/reject',
  async ({ transactionId, reason }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.rejectPayment({
        transactionId,
        reason,
      });
      return { transactionId, data: response.data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to reject payment'
      );
    }
  }
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearPaymentsError: (state) => {
      state.error = null;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    // ✅ NEW: Clear all payments data
    clearPayments: (state) => {
      state.payments = undefined;
      state.totalPages = 0;
      state.currentPage = 1;
      state.totalPending = 0;
      state.loading = false;
      state.actionLoading = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch pending payments
      .addCase(fetchPendingPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.transactions;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.totalPending = action.payload.totalPending;
      })
      .addCase(fetchPendingPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Approve payment
      .addCase(approvePayment.pending, (state, action) => {
        state.actionLoading = action.meta.arg.transactionId;
      })
      .addCase(approvePayment.fulfilled, (state, action) => {
        state.actionLoading = null;
        state.payments = state.payments.filter(
          (p) => p._id !== action.payload.transactionId
        );
        state.totalPending -= 1;
      })
      .addCase(approvePayment.rejected, (state, action) => {
        state.actionLoading = null;
        state.error = action.payload;
      })

      // Reject payment
      .addCase(rejectPayment.pending, (state, action) => {
        state.actionLoading = action.meta.arg.transactionId;
      })
      .addCase(rejectPayment.fulfilled, (state, action) => {
        state.actionLoading = null;
        state.payments = state.payments.filter(
          (p) => p._id !== action.payload.transactionId
        );
        state.totalPending -= 1;
      })
      .addCase(rejectPayment.rejected, (state, action) => {
        state.actionLoading = null;
        state.error = action.payload;
      });
  },
});

export const { clearPaymentsError, setCurrentPage, clearPayments } = paymentsSlice.actions;
export default paymentsSlice.reducer;
