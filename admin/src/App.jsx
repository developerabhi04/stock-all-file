import { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { loadAdmin } from './store/slices/authSlice';

import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PaymentManager from './pages/PaymentManager';
import Transactions from './pages/Transactions';
import UserDetails from './pages/user/UserDetails';
import Users from './pages/user/User';
import MarketOverview from './pages/MarketOverview';
import StocksManagement from './pages/StocksManagement';
import IndicesManagement from './pages/IndicesManagement';
import BannerManagement from './pages/banner/BannerManagement';
import PushNotifications from './pages/notification/PushNotifications';
import IndexCategories from './pages/IndexCategories';
import Reports from './pages/reports/Reports';
import AdminManagement from './pages/AdminManagement';
import UserInvestmentsPage from './components/Users/UserInvestmentsPage';
import UserTransactionsPage from './components/Users/UserTransactionsPage';
import ReferralManagement from './pages/referral/ReferralManagement';

import { connectAdminSocket } from './services/socket';
import { fetchPendingPayments } from './store/slices/paymentsSlice';
import { fetchPendingWithdrawals } from './store/slices/withdrawalsSlice';
import SupportChat from './pages/support/SupportChat';


const ProtectedRoute = ({
  children,
  requireSuperAdmin = false,
}) => {
  const {
    isAuthenticated,
    loading,
    admin,
  } = useSelector((state) => state.auth);

  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (admin?.role === 'super_admin') {
    return children;
  }

  if (requireSuperAdmin) {
    return (
      <Navigate
        to="/dashboard/payment-manager"
        replace
      />
    );
  }

  const currentPath = location.pathname;
  const allowedRoutes = admin?.allowedRoutes || [];

  const hasAccess = allowedRoutes.some((route) => {
    if (currentPath === route) {
      return true;
    }

    return currentPath.startsWith(`${route}/`);
  });

  if (!hasAccess) {
    const firstAllowedRoute = allowedRoutes.find((route) =>
      route.startsWith('/dashboard')
    );

    return (
      <Navigate
        to={firstAllowedRoute || '/login'}
        replace
      />
    );
  }

  return children;
};

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, token } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadAdmin());
  }, [dispatch]);


  // 🔔 Setup socket + desktop notifications when admin is ready
  useEffect(() => {
    if (loading || !isAuthenticated || !token) return;

    // Ask once for browser notification permission
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => { });
    }

    const socket = connectAdminSocket();
    if (!socket) return;

    const handleDeposit = (payload) => {
      console.log('💰 New deposit request:', payload);

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const n = new Notification('New Deposit Request', {
          body: `₹${payload.amount} via ${payload.gateway} (UTR: ${payload.utrNumber})`,
          icon: '/favicon.ico',
        });
        n.onclick = () => window.focus();
      }

      // Auto-refresh pending deposits
      dispatch(fetchPendingPayments({ page: 1, limit: 20 }));
    };

    const handleWithdrawal = (payload) => {
      console.log('🏦 New withdrawal request:', payload);

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const n = new Notification('New Withdrawal Request', {
          body: `₹${payload.amount} to ${payload.bankName} • ****${payload.accountLast4}`,
          icon: '/favicon.ico',
        });
        n.onclick = () => window.focus();
      }

      // Auto-refresh pending withdrawals
      dispatch(fetchPendingWithdrawals({ page: 1, limit: 20 }));
    };

    socket.on('new_deposit_request', handleDeposit);
    socket.on('new_withdrawal_request', handleWithdrawal);

    return () => {
      socket.off('new_deposit_request', handleDeposit);
      socket.off('new_withdrawal_request', handleWithdrawal);
      // we keep the connection open; don't disconnect here unless you want to
    };
  }, [loading, isAuthenticated, token, dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <ProtectedRoute requireSuperAdmin>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />

          <Route
            path="users/:userId"
            element={
              <ProtectedRoute>
                <UserDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="users/:userId/investments"
            element={
              <ProtectedRoute>
                <UserInvestmentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="users/:userId/transactions"
            element={
              <ProtectedRoute>
                <UserTransactionsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="payment-manager"
            element={
              <ProtectedRoute>
                <PaymentManager />
              </ProtectedRoute>
            }
          />

          <Route
            path="payment-manager/payments"
            element={
              <ProtectedRoute>
                <PaymentManager defaultTab="payments" />
              </ProtectedRoute>
            }
          />

          <Route
            path="payment-manager/withdrawals"
            element={
              <ProtectedRoute>
                <PaymentManager defaultTab="withdrawals" />
              </ProtectedRoute>
            }
          />

          <Route
            path="payment-manager/config"
            element={
              <ProtectedRoute>
                <PaymentManager defaultTab="config" />
              </ProtectedRoute>
            }
          />

          <Route
            path="transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />

          <Route
            path="market"
            element={
              <ProtectedRoute>
                <MarketOverview />
              </ProtectedRoute>
            }
          />

          <Route
            path="market/stocks"
            element={
              <ProtectedRoute>
                <StocksManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="market/indices"
            element={
              <ProtectedRoute>
                <IndicesManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="index-categories"
            element={
              <ProtectedRoute>
                <IndexCategories />
              </ProtectedRoute>
            }
          />

          <Route
            path="banners"
            element={
              <ProtectedRoute>
                <BannerManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="notifications"
            element={
              <ProtectedRoute>
                <PushNotifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />

          <Route
            path="admins"
            element={
              <ProtectedRoute requireSuperAdmin>
                <AdminManagement />
              </ProtectedRoute>
            }
          />

          {/* This creates /dashboard/referrals */}
          <Route
            path="referrals"
            element={
              <ProtectedRoute>
                <ReferralManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="support"
            element={
              <ProtectedRoute>
                <SupportChat />
              </ProtectedRoute>
            }
          />
        </Route>



        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;