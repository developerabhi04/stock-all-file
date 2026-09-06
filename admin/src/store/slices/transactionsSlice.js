import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../services/api';

const DEFAULT_LIMIT = 40;

const initialState = {
  transactions: [],
  totalPages: 0,
  currentPage: 1,
  totalTransactions: 0,

  // Default number of transaction records visible on one page.
  limit: DEFAULT_LIMIT,

  filters: {
    status: '',
    category: '',
    startDate: '',
    endDate: '',
  },

  loading: false,
  isFetching: false,
  error: null,

  currentRequestId: null,
};

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchAll',
  async (
    {
      page = 1,
      limit = DEFAULT_LIMIT,
      status = '',
      category = '',
      startDate = '',
      endDate = '',
      userId = '',
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);

      /*
        No maximum limit is enforced here.

        Examples:
        limit: 40     -> 40 transactions on one page
        limit: 100    -> 100 transactions on one page
        limit: 1000   -> 1000 transactions on one page

        The full transaction history is still accessed through pages.
      */
      const safeLimit = Math.max(
        Number.parseInt(limit, 10) || DEFAULT_LIMIT,
        1
      );

      const params = {
        page: safePage,
        limit: safeLimit,
      };

      if (status) {
        params.status = status;
      }

      if (category) {
        params.category = category;
      }

      if (startDate) {
        params.startDate = startDate;
      }

      if (endDate) {
        params.endDate = endDate;
      }

      if (userId) {
        params.userId = userId;
      }

      const response = await adminAPI.getAllTransactions(params);

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch transactions'
      );
    }
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,

  reducers: {
    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };

      state.currentPage = 1;
    },

    clearFilters: (state) => {
      state.filters = {
        status: '',
        category: '',
        startDate: '',
        endDate: '',
      };

      state.currentPage = 1;
    },

    setPage: (state, action) => {
      const page = Number.parseInt(action.payload, 10);

      state.currentPage = Math.max(page || 1, 1);
    },

    setLimit: (state, action) => {
      const nextLimit = Number.parseInt(action.payload, 10);

      /*
        No maximum limit here.

        If you select 40, 40 rows appear per page.
        If you select 500, 500 rows appear per page.
      */
      state.limit = Math.max(nextLimit || DEFAULT_LIMIT, 1);

      // Start at page 1 after changing transactions per page.
      state.currentPage = 1;
    },

    clearTransactionsError: (state) => {
      state.error = null;
    },

    clearTransactions: (state) => {
      state.transactions = [];
      state.totalPages = 0;
      state.currentPage = 1;
      state.totalTransactions = 0;
      state.error = null;
      state.loading = false;
      state.isFetching = false;
      state.currentRequestId = null;
    },

    resetTransactionsState: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state, action) => {
        state.isFetching = true;
        state.error = null;
        state.currentRequestId = action.meta.requestId;

        // Show full-page loading only for the first empty request.
        if (state.transactions.length === 0) {
          state.loading = true;
        }
      })

      .addCase(fetchTransactions.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;
        state.isFetching = false;
        state.currentRequestId = null;

        state.transactions = action.payload?.transactions || [];
        state.totalPages = Number(action.payload?.totalPages || 0);
        state.currentPage = Number(action.payload?.currentPage || 1);
        state.totalTransactions = Number(
          action.payload?.totalTransactions || 0
        );

        if (action.payload?.limit) {
          state.limit = Number(action.payload.limit);
        }
      })

      .addCase(fetchTransactions.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;
        state.isFetching = false;
        state.currentRequestId = null;
        state.error = action.payload || 'Failed to fetch transactions';

        state.transactions = [];
        state.totalPages = 0;
        state.totalTransactions = 0;
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setPage,
  setLimit,
  clearTransactionsError,
  clearTransactions,
  resetTransactionsState,
} = transactionsSlice.actions;

export default transactionsSlice.reducer;