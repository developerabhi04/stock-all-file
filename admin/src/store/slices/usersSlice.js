import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { adminAPI } from "../../services/api";

const DEFAULT_PAGE_SIZE = 20;

const initialState = {
  users: [],
  userDetails: null,
  stats: null,

  totalPages: 0,
  currentPage: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalUsers: 0,
  totalWalletBalance: 0,
  totalWithdrawals: 0,
  pendingWithdrawals: 0,

  listStatus: "idle",
  detailsStatus: "idle",
  statsStatus: "idle",
  balanceUpdateStatus: "idle",
  deleteStatus: "idle",
  genuineStatus: "idle",

  error: null,
  deleteError: null,
  genuineError: null,

  filters: {
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
};

const normalizeUser = (user = {}) => ({
  ...user,

  _id: user._id || user.id || "",
  id: user.id || user._id || "",

  walletBalance: Number(user.walletBalance || 0),

  totalInvested: Number(user.totalInvested ?? user.totalInvestedAmount ?? 0),

  totalInterestEarned: Number(user.totalInterestEarned || 0),
  ordersCount: Number(user.ordersCount || 0),

  // Genuine/favorite/pinned user state.
  isGenuine: Boolean(user.isGenuine),
  isGenuineUpdating: false,
});

const normalizeUserDetails = (payload = {}) => {
  const normalizedUser = normalizeUser(payload.user || {});

  const allTransactions = Array.isArray(payload.transactions)
    ? payload.transactions
    : Array.isArray(payload.recentTransactions)
      ? payload.recentTransactions
      : [];

  const investments = Array.isArray(payload.investments)
    ? payload.investments
    : [];

  return {
    ...payload,

    user: normalizedUser,

    transactions: allTransactions,
    recentTransactions: allTransactions,

    investments,

    portfolioSummary: payload.portfolioSummary || {},

    investmentOrders: payload.investmentOrders || {
      pending: [],
      active: [],
      unlocked: [],
      completed: [],
      cancelled: [],
      all: [],
    },
  };
};

export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async (
    {
      page = 1,
      limit = DEFAULT_PAGE_SIZE,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = {},
    { rejectWithValue },
  ) => {
    try {
      const safePage = Math.max(1, Number.parseInt(page, 10) || 1);

      const safeLimit = Math.max(
        1,
        Number.parseInt(limit, 10) || DEFAULT_PAGE_SIZE,
      );

      const response = await adminAPI.getAllUsers({
        page: safePage,
        limit: safeLimit,
        search,
        sortBy,
        sortOrder,
      });

      const data = response?.data?.data;

      if (!data) {
        return rejectWithValue("No data received from server");
      }

      let withdrawalStats = {
        totalWithdrawals: 0,
        pendingAmount: 0,
      };

      try {
        const statsResponse = await adminAPI.getWithdrawalStats();

        withdrawalStats = statsResponse?.data?.data || withdrawalStats;
      } catch (error) {
        console.warn("Withdrawal stats fetch failed:", error?.message);
      }

      return {
        users: Array.isArray(data.users) ? data.users.map(normalizeUser) : [],

        totalPages: Number(data.totalPages || 0),
        currentPage: Number(data.currentPage || safePage),
        pageSize: safeLimit,

        totalUsers: Number(data.totalUsers || 0),

        totalWalletBalance: Number(data.totalWalletBalance || 0),

        totalWithdrawals: Number(withdrawalStats.totalWithdrawals || 0),

        pendingWithdrawals: Number(withdrawalStats.pendingAmount || 0),
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users",
      );
    }
  },
);

export const fetchUserStats = createAsyncThunk(
  "users/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getUserStats();

      return response?.data?.data || {};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch stats",
      );
    }
  },
);

export const fetchUserDetails = createAsyncThunk(
  "users/fetchDetails",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getUserDetails(userId);

      return normalizeUserDetails(response?.data?.data || {});
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user details",
      );
    }
  },
);

export const updateUserBalance = createAsyncThunk(
  "users/updateBalance",
  async (data, { rejectWithValue }) => {
    try {
      const response = await adminAPI.updateUserBalance(data);

      return response?.data?.data || {};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update balance",
      );
    }
  },
);

export const toggleUserGenuine = createAsyncThunk(
  "users/toggleGenuine",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await adminAPI.toggleUserGenuine(userId);

      return response?.data?.data || {};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update genuine user status",
      );
    }
  },
);

export const deleteUser = createAsyncThunk(
  "users/delete",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await adminAPI.deleteUser(userId);

      return {
        userId: String(userId),
        data: response?.data?.data || {},
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete user",
      );
    }
  },
);

const usersSlice = createSlice({
  name: "users",
  initialState,

  reducers: {
    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };

      state.currentPage = 1;
    },

    setPage: (state, action) => {
      const requestedPage = Number.parseInt(action.payload, 10);

      state.currentPage = Math.max(1, requestedPage || 1);
    },

    setPageSize: (state, action) => {
      const requestedPageSize = Number.parseInt(action.payload, 10);

      state.pageSize = Math.max(1, requestedPageSize || DEFAULT_PAGE_SIZE);

      state.currentPage = 1;
    },

    clearError: (state) => {
      state.error = null;
    },

    clearDeleteError: (state) => {
      state.deleteError = null;
    },

    clearGenuineError: (state) => {
      state.genuineError = null;
    },

    clearUserDetails: (state) => {
      state.userDetails = null;
      state.detailsStatus = "idle";
    },

    resetBalanceUpdateStatus: (state) => {
      state.balanceUpdateStatus = "idle";
    },

    resetDeleteStatus: (state) => {
      state.deleteStatus = "idle";
      state.deleteError = null;
    },

    resetGenuineStatus: (state) => {
      state.genuineStatus = "idle";
      state.genuineError = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch all users
      .addCase(fetchUsers.pending, (state) => {
        state.listStatus = "loading";
        state.error = null;
      })

      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.listStatus = "succeeded";

        state.users = action.payload.users || [];

        state.totalPages = Number(action.payload.totalPages || 0);

        state.currentPage = Number(action.payload.currentPage || 1);

        state.pageSize = Number(action.payload.pageSize || state.pageSize);

        state.totalUsers = Number(action.payload.totalUsers || 0);

        state.totalWalletBalance = Number(
          action.payload.totalWalletBalance || 0,
        );

        state.totalWithdrawals = Number(action.payload.totalWithdrawals || 0);

        state.pendingWithdrawals = Number(
          action.payload.pendingWithdrawals || 0,
        );
      })

      .addCase(fetchUsers.rejected, (state, action) => {
        state.listStatus = "failed";
        state.error = action.payload;
        state.users = [];
      })

      // Fetch overall user stats
      .addCase(fetchUserStats.pending, (state) => {
        state.statsStatus = "loading";
      })

      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.statsStatus = "succeeded";
        state.stats = action.payload;
      })

      .addCase(fetchUserStats.rejected, (state, action) => {
        state.statsStatus = "failed";
        state.error = action.payload;
      })

      // Fetch individual user details
      .addCase(fetchUserDetails.pending, (state) => {
        state.detailsStatus = "loading";
        state.error = null;
      })

      .addCase(fetchUserDetails.fulfilled, (state, action) => {
        state.detailsStatus = "succeeded";
        state.userDetails = action.payload;
      })

      .addCase(fetchUserDetails.rejected, (state, action) => {
        state.detailsStatus = "failed";
        state.error = action.payload;
      })

      // Update wallet balance
      .addCase(updateUserBalance.pending, (state) => {
        state.balanceUpdateStatus = "loading";
        state.error = null;
      })

      .addCase(updateUserBalance.fulfilled, (state, action) => {
        state.balanceUpdateStatus = "succeeded";

        const updatedUser = action.payload?.user || {};

        const userId = String(updatedUser._id || updatedUser.id || "");

        if (!userId) {
          return;
        }

        const newWalletBalance = Number(
          updatedUser.newWalletBalance ?? updatedUser.walletBalance ?? 0,
        );

        const listUserIndex = state.users.findIndex(
          (user) => String(user._id || user.id) === userId,
        );

        if (listUserIndex !== -1) {
          state.users[listUserIndex].walletBalance = newWalletBalance;
        }

        const detailsUserId = String(
          state.userDetails?.user?._id || state.userDetails?.user?.id || "",
        );

        if (detailsUserId === userId && state.userDetails?.user) {
          state.userDetails.user.walletBalance = newWalletBalance;
        }
      })

      .addCase(updateUserBalance.rejected, (state, action) => {
        state.balanceUpdateStatus = "failed";
        state.error = action.payload;
      })

      // Toggle genuine / favorite status
      .addCase(toggleUserGenuine.pending, (state, action) => {
        const userId = String(action.meta.arg);

        state.genuineStatus = "loading";
        state.genuineError = null;

        const user = state.users.find(
          (item) => String(item._id || item.id) === userId,
        );

        if (user) {
          user.isGenuineUpdating = true;
        }
      })

      .addCase(toggleUserGenuine.fulfilled, (state, action) => {
        const userId = String(action.payload?.userId || "");

        const isGenuine = Boolean(action.payload?.isGenuine);

        state.genuineStatus = "succeeded";

        const user = state.users.find(
          (item) => String(item._id || item.id) === userId,
        );

        if (user) {
          user.isGenuine = isGenuine;
          user.isGenuineUpdating = false;
        }

        const detailsUserId = String(
          state.userDetails?.user?._id || state.userDetails?.user?.id || "",
        );

        if (detailsUserId === userId && state.userDetails?.user) {
          state.userDetails.user.isGenuine = isGenuine;
        }
      })

      .addCase(toggleUserGenuine.rejected, (state, action) => {
        const userId = String(action.meta.arg);

        state.genuineStatus = "failed";

        state.genuineError =
          action.payload || "Failed to update genuine user status";

        const user = state.users.find(
          (item) => String(item._id || item.id) === userId,
        );

        if (user) {
          user.isGenuineUpdating = false;
        }
      })

      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })

      .addCase(deleteUser.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";

        const deletedUserId = String(action.payload.userId);

        state.users = state.users.filter(
          (user) => String(user._id || user.id) !== deletedUserId,
        );

        state.totalUsers = Math.max(0, state.totalUsers - 1);

        const detailsUserId = String(
          state.userDetails?.user?._id || state.userDetails?.user?.id || "",
        );

        if (detailsUserId === deletedUserId) {
          state.userDetails = null;
          state.detailsStatus = "idle";
        }
      })

      .addCase(deleteUser.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload || "Failed to delete user";
      });
  },
});

export const {
  setFilters,
  setPage,
  setPageSize,
  clearError,
  clearDeleteError,
  clearGenuineError,
  clearUserDetails,
  resetBalanceUpdateStatus,
  resetDeleteStatus,
  resetGenuineStatus,
} = usersSlice.actions;

export default usersSlice.reducer;
