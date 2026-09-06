import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../services/api';

const initialState = {
    stocks: [],
    stockDetails: null,
    totalStocks: 0,

    indices: [],
    indexDetails: null,
    totalIndices: 0,

    loading: false,
    actionLoading: false,
    error: null,

    filters: {
        category: '',
        featured: '',
        search: '',
    },
};

// ================= STOCKS =================
export const fetchStocks = createAsyncThunk(
    'market/fetchStocks',
    async (
        { page = 1, limit = 50, category = '', featured = '', search = '' } = {},
        { rejectWithValue }
    ) => {
        try {
            const params = { page, limit };
            if (category) params.category = category;
            if (featured !== '') params.featured = featured;
            if (search) params.search = search;

            const response = await adminAPI.getAllStocks(params);
            return response?.data?.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch stocks'
            );
        }
    }
);

export const createStock = createAsyncThunk(
    'market/createStock',
    async (stockData, { rejectWithValue }) => {
        try {
            const response = await adminAPI.createStock(stockData);
            return response?.data?.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to create stock'
            );
        }
    }
);

export const updateStock = createAsyncThunk(
    'market/updateStock',
    async ({ stockId, data }, { rejectWithValue }) => {
        try {
            const response = await adminAPI.updateStock(stockId, data);
            return response?.data?.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to update stock'
            );
        }
    }
);

export const deleteStock = createAsyncThunk(
    'market/deleteStock',
    async (stockId, { rejectWithValue }) => {
        try {
            await adminAPI.deleteStock(stockId);
            return stockId;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to delete stock'
            );
        }
    }
);

// ================= INDICES =================
export const fetchIndices = createAsyncThunk(
    'market/fetchIndices',
    async (
        { page = 1, limit = 50, category = '', featured = '', search = '' } = {},
        { rejectWithValue }
    ) => {
        try {
            const params = { page, limit };
            if (category) params.category = category;
            if (featured !== '') params.featured = featured;
            if (search) params.search = search;

            const response = await adminAPI.getAllIndices(params);
            return response?.data?.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch indices'
            );
        }
    }
);

export const createIndex = createAsyncThunk(
    'market/createIndex',
    async (indexData, { rejectWithValue }) => {
        try {
            const response = await adminAPI.createIndex(indexData);
            return response?.data?.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to create index'
            );
        }
    }
);

export const updateIndex = createAsyncThunk(
    'market/updateIndex',
    async ({ indexId, data }, { rejectWithValue }) => {
        try {
            const response = await adminAPI.updateIndex(indexId, data);
            return response?.data?.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to update index'
            );
        }
    }
);

export const deleteIndex = createAsyncThunk(
    'market/deleteIndex',
    async (indexId, { rejectWithValue }) => {
        try {
            await adminAPI.deleteIndex(indexId);
            return indexId;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to delete index'
            );
        }
    }
);

const marketSlice = createSlice({
    name: 'market',
    initialState,
    reducers: {
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // ================= STOCKS =================
            .addCase(fetchStocks.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStocks.fulfilled, (state, action) => {
                state.loading = false;
                state.stocks = Array.isArray(action.payload?.stocks)
                    ? action.payload.stocks.filter(Boolean)
                    : [];
                state.totalStocks = action.payload?.total || 0;
            })
            .addCase(fetchStocks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(createStock.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(createStock.fulfilled, (state, action) => {
                state.actionLoading = false;
                const newStock = action.payload;

                if (newStock?._id) {
                    state.stocks = [newStock, ...(state.stocks || []).filter(Boolean)];
                    state.totalStocks += 1;
                }
            })
            .addCase(createStock.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })

            .addCase(updateStock.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(updateStock.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updatedStock = action.payload;

                if (!updatedStock?._id) return;

                const stockIndex = state.stocks.findIndex((s) => s?._id === updatedStock._id);

                if (stockIndex !== -1) {
                    state.stocks[stockIndex] = updatedStock;
                }
            })
            .addCase(updateStock.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })

            .addCase(deleteStock.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(deleteStock.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.stocks = (state.stocks || []).filter(
                    (s) => s && s._id !== action.payload
                );
                state.totalStocks = Math.max(0, state.totalStocks - 1);
            })
            .addCase(deleteStock.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })

            // ================= INDICES =================
            .addCase(fetchIndices.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchIndices.fulfilled, (state, action) => {
                state.loading = false;
                state.indices = Array.isArray(action.payload?.indices)
                    ? action.payload.indices.filter(Boolean)
                    : [];
                state.totalIndices = action.payload?.total || 0;
            })
            .addCase(fetchIndices.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(createIndex.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(createIndex.fulfilled, (state, action) => {
                state.actionLoading = false;
                const newIndex = action.payload;

                if (newIndex?._id) {
                    state.indices = [newIndex, ...(state.indices || []).filter(Boolean)];
                    state.totalIndices += 1;
                }
            })
            .addCase(createIndex.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })

            .addCase(updateIndex.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(updateIndex.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updatedIndex = action.payload;

                if (!updatedIndex?._id) return;

                const indexPosition = state.indices.findIndex(
                    (i) => i?._id === updatedIndex._id
                );

                if (indexPosition !== -1) {
                    state.indices[indexPosition] = updatedIndex;
                }
            })
            .addCase(updateIndex.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })

            .addCase(deleteIndex.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(deleteIndex.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.indices = (state.indices || []).filter(
                    (i) => i && i._id !== action.payload
                );
                state.totalIndices = Math.max(0, state.totalIndices - 1);
            })
            .addCase(deleteIndex.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            });
    },
});

export const { setFilters, clearError } = marketSlice.actions;
export default marketSlice.reducer;