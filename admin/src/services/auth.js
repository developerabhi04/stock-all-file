import { createSlice } from '@reduxjs/toolkit';

const getStoredToken = () => {
    try {
        return localStorage.getItem('adminToken');
    } catch (error) {
        console.error('❌ Error reading adminToken:', error);
        return null;
    }
};

const getStoredAdmin = () => {
    try {
        const adminData = localStorage.getItem('adminData');
        return adminData ? JSON.parse(adminData) : null;
    } catch (error) {
        console.error('❌ Error reading adminData:', error);
        localStorage.removeItem('adminData');
        return null;
    }
};

const clearStoredAdminSession = () => {
    try {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
    } catch (error) {
        console.error('❌ Error clearing admin session:', error);
    }
};

const initialToken = getStoredToken();
const initialAdmin = getStoredAdmin();

const initialState = {
    admin: initialAdmin,
    token: initialToken,
    isAuthenticated: !!initialToken,
    loading: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            state.admin = action.payload.admin;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.loading = false;

            try {
                localStorage.setItem('adminToken', action.payload.token);
                localStorage.setItem('adminData', JSON.stringify(action.payload.admin));
            } catch (error) {
                console.error('❌ Error saving admin session:', error);
            }

            console.log('✅ Admin logged in:', action.payload.admin);
        },

        logout: (state) => {
            state.admin = null;
            state.token = null;
            state.isAuthenticated = false;
            state.loading = false;

            clearStoredAdminSession();
            console.log('🚪 Admin logged out');
        },

        loadAdmin: (state) => {
            const token = getStoredToken();
            const admin = getStoredAdmin();

            if (token && admin) {
                state.token = token;
                state.admin = admin;
                state.isAuthenticated = true;
                console.log('✅ Admin loaded from storage:', admin);
            } else {
                state.admin = null;
                state.token = null;
                state.isAuthenticated = false;
            }

            state.loading = false;
        },
    },
});

export const { loginSuccess, logout, loadAdmin } = authSlice.actions;

export default authSlice.reducer;