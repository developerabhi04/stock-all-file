import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../services/api';

const initialState = {
  withdrawals: undefined,
  totalPages: 0,
  currentPage: 1,
  totalPending: 0,
  loading: false,
  actionLoading: null,
  error: null,
};

// Fetch pending withdrawals
export const fetchPendingWithdrawals = createAsyncThunk(
  'withdrawals/fetchPending',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getPendingWithdrawals(page, limit);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch withdrawals'
      );
    }
  }
);

// Approve withdrawal
export const approveWithdrawal = createAsyncThunk(
  'withdrawals/approve',
  async ({ transactionId, utrNumber, verificationNote }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.approveWithdrawal({
        transactionId,
        utrNumber,
        verificationNote,
      });
      return { transactionId, data: response.data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to approve withdrawal'
      );
    }
  }
);

// Reject withdrawal
export const rejectWithdrawal = createAsyncThunk(
  'withdrawals/reject',
  async ({ transactionId, reason }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.rejectWithdrawal({
        transactionId,
        reason,
      });
      return { transactionId, data: response.data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to reject withdrawal'
      );
    }
  }
);

const withdrawalsSlice = createSlice({
  name: 'withdrawals',
  initialState,
  reducers: {
    clearWithdrawalsError: (state) => {
      state.error = null;
    },
    // ✅ NEW: Clear all withdrawals data
    clearWithdrawals: (state) => {
      state.withdrawals = undefined;
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
      // Fetch pending withdrawals
      .addCase(fetchPendingWithdrawals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingWithdrawals.fulfilled, (state, action) => {
        state.loading = false;
        state.withdrawals = action.payload.withdrawals;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.totalPending = action.payload.totalPending;
      })
      .addCase(fetchPendingWithdrawals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Approve withdrawal
      .addCase(approveWithdrawal.pending, (state, action) => {
        state.actionLoading = action.meta.arg.transactionId;
      })
      .addCase(approveWithdrawal.fulfilled, (state, action) => {
        state.actionLoading = null;
        state.withdrawals = state.withdrawals.filter(
          (w) => w._id !== action.payload.transactionId
        );
        state.totalPending -= 1;
      })
      .addCase(approveWithdrawal.rejected, (state, action) => {
        state.actionLoading = null;
        state.error = action.payload;
      })

      // Reject withdrawal
      .addCase(rejectWithdrawal.pending, (state, action) => {
        state.actionLoading = action.meta.arg.transactionId;
      })
      .addCase(rejectWithdrawal.fulfilled, (state, action) => {
        state.actionLoading = null;
        state.withdrawals = state.withdrawals.filter(
          (w) => w._id !== action.payload.transactionId
        );
        state.totalPending -= 1;
      })
      .addCase(rejectWithdrawal.rejected, (state, action) => {
        state.actionLoading = null;
        state.error = action.payload;
      });
  },
});

export const { clearWithdrawalsError, clearWithdrawals } = withdrawalsSlice.actions;
export default withdrawalsSlice.reducer;
