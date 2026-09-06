import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import Loading from '../../components/Loader';
import { fetchTransactions } from '../../store/slices/transactionsSlice';
import {
  fetchUserDetails,
  resetBalanceUpdateStatus,
  updateUserBalance,
} from '../../store/slices/usersSlice';

import UpdateBalanceModal from '../../components/Users/UpdateBalanceModal';
import UserBalanceCards from '../../components/Users/UserBalanceCards';
import UserBankDetails from '../../components/Users/UserBankDetails';
import UserProfileCard from '../../components/Users/UserProfileCard';

const USER_TRANSACTIONS_PAGE_LIMIT = 40;

const getInvestmentAmount = (item = {}) => {
  const amount =
    item.amount ??
    item.principalAmount ??
    item.investedAmount ??
    item.totalAmount ??
    0;

  const number = Number(amount);

  return Number.isFinite(number) ? number : 0;
};

const buildPortfolioSummary = (userDetails = {}) => {
  const backendPortfolio = userDetails.portfolioSummary || {};

  const investments = Array.isArray(userDetails.investments)
    ? userDetails.investments
    : [];

  const totalInvested =
    backendPortfolio.totalInvested ??
    backendPortfolio.totalPrincipalInvested ??
    investments.reduce((sum, item) => sum + getInvestmentAmount(item), 0);

  const activeInvested = investments.reduce((sum, item) => {
    const status = String(item.status || '').toLowerCase();

    return status === 'active'
      ? sum + getInvestmentAmount(item)
      : sum;
  }, 0);

  const activeInvestmentsCount = investments.filter((item) => {
    return String(item.status || '').toLowerCase() === 'active';
  }).length;

  const completedInvested = investments.reduce((sum, item) => {
    const status = String(item.status || '').toLowerCase();

    return ['completed', 'approved'].includes(status)
      ? sum + getInvestmentAmount(item)
      : sum;
  }, 0);

  const completedInvestmentsCount = investments.filter((item) => {
    const status = String(item.status || '').toLowerCase();

    return ['completed', 'approved'].includes(status);
  }).length;

  const currentValue =
    backendPortfolio.currentValue ??
    backendPortfolio.totalCurrentValue ??
    investments.reduce(
      (sum, item) =>
        sum +
        getInvestmentAmount(item) +
        Number(item.totalInterestEarned || 0),
      0
    );

  const totalPnL =
    backendPortfolio.totalPnL ??
    backendPortfolio.totalInterestEarned ??
    currentValue - totalInvested;

  const totalPnLPercent =
    backendPortfolio.totalPnLPercent ??
    (totalInvested > 0
      ? (Number(totalPnL || 0) / Number(totalInvested)) * 100
      : 0);

  const todayPnL =
    backendPortfolio.todayPnL ??
    backendPortfolio.totalDailyEarning ??
    investments.reduce(
      (sum, item) =>
        sum + Number(item.dailyInterestAmount || item.dailyReturn || 0),
      0
    );

  const statusBuckets = investments.reduce(
    (acc, item) => {
      const status = String(item.status || 'pending').toLowerCase();

      acc.all += 1;

      if (['pending', 'processing', 'initiated'].includes(status)) {
        acc.pending += 1;
      } else if (status === 'active') {
        acc.active += 1;
      } else if (status === 'unlocked') {
        acc.unlocked += 1;
      } else if (['completed', 'approved'].includes(status)) {
        acc.completed += 1;
      } else if (['closed', 'closed_reinvested'].includes(status)) {
        acc.closed += 1;
      } else if (['cancelled', 'rejected', 'failed'].includes(status)) {
        acc.cancelled += 1;
      } else {
        acc.other += 1;
      }

      return acc;
    },
    {
      all: 0,
      pending: 0,
      active: 0,
      unlocked: 0,
      completed: 0,
      closed: 0,
      cancelled: 0,
      other: 0,
    }
  );

  return {
    ...backendPortfolio,

    totalInvested: Number(totalInvested || 0),

    activeInvested: Number(activeInvested || 0),
    activeInvestmentsCount,

    completedInvested: Number(completedInvested || 0),
    completedInvestmentsCount,

    currentValue: Number(currentValue || 0),
    totalPnL: Number(totalPnL || 0),
    totalPnLPercent: Number(totalPnLPercent || 0),
    todayPnL: Number(todayPnL || 0),

    statusBuckets,
  };
};

/*
  IMPORTANT:
  `userTransactions` below contains only one paginated page (40 records).
  Never calculate lifetime deposit/withdrawal/credit/debit totals only from it.

  Preferred source is the user-details API response:
  userDetails.transactionSummary or userDetails.stats.

  The fallback values below are explicitly named `page*` to make clear they
  represent only the currently fetched transaction page if backend totals
  have not been added yet.
*/
const buildAdminStats = (userDetails = {}, pageTransactions = [], totalTransactions = 0) => {
  const user = userDetails.user || {};
  const investments = Array.isArray(userDetails.investments) ? userDetails.investments : [];
  const backendSummary = userDetails.transactionSummary || userDetails.stats || {};
  const txns = Array.isArray(pageTransactions) ? pageTransactions : [];

  const pageCredits = txns.reduce(
    (sum, txn) => String(txn.type || '').toLowerCase() === 'credit'
      ? sum + Number(txn.amount || 0)
      : sum,
    0
  );

  const pageDebits = txns.reduce(
    (sum, txn) => String(txn.type || '').toLowerCase() === 'debit'
      ? sum + Math.abs(Number(txn.amount || 0))
      : sum,
    0
  );

  const pageDeposits = txns.reduce((sum, txn) => {
    const isCompletedDeposit =
      String(txn.category || '').toLowerCase() === 'add_money' &&
      String(txn.type || '').toLowerCase() === 'credit' &&
      ['completed', 'success', 'approved'].includes(String(txn.status || '').toLowerCase());

    return isCompletedDeposit ? sum + Number(txn.amount || 0) : sum;
  }, 0);

  const pageWithdrawals = txns.reduce((sum, txn) => {
    const isWithdrawal =
      String(txn.category || '').toLowerCase() === 'withdrawal' &&
      String(txn.type || '').toLowerCase() === 'debit' &&
      ['completed', 'success', 'approved', 'pending', 'rejected'].includes(
        String(txn.status || '').toLowerCase()
      );

    return isWithdrawal ? sum + Math.abs(Number(txn.amount || 0)) : sum;
  }, 0);

  const pageInterest = txns.reduce((sum, txn) => {
    const isInterest =
      String(txn.category || '').toLowerCase() === 'investment_interest' &&
      String(txn.type || '').toLowerCase() === 'credit' &&
      ['completed', 'success', 'approved'].includes(String(txn.status || '').toLowerCase());

    return isInterest ? sum + Number(txn.amount || 0) : sum;
  }, 0);

  const fallbackInterest = investments.reduce(
    (sum, item) => sum + Number(item.totalInterestEarned || 0),
    0
  );

  const walletBalance = Number(user.walletBalance || 0);
  const totalInvested = investments.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return {
    walletBalance,

    // These use backend lifetime values when available.
    // The fallbacks are page-one values until you add transactionSummary to
    // your GET /admin/users/:userId backend endpoint.
    totalTransactions: Number(backendSummary.totalTransactions ?? totalTransactions ?? 0),
    totalCredits: Number(backendSummary.totalCredits ?? pageCredits),
    totalDebits: Number(backendSummary.totalDebits ?? pageDebits),
    totalDeposits: Number(backendSummary.totalDeposits ?? pageDeposits),
    totalWithdrawals: Number(backendSummary.totalWithdrawals ?? pageWithdrawals),
    totalInterestEarned: Number(backendSummary.totalInterestEarned ?? pageInterest ?? fallbackInterest),

    totalInvestments: investments.length,
    principalInSystem: walletBalance + totalInvested,

    // Optional fields if UserBalanceCards wants to show page context.
    pageCredits,
    pageDebits,
    pageDeposits,
    pageWithdrawals,
  };
};

const UserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userDetails, detailsStatus, balanceUpdateStatus, error } = useSelector(
    (state) => state.users
  );

  const {
    transactions: userTransactions = [],
    loading: transactionsLoading,
    totalTransactions,
  } = useSelector((state) => state.transactions);

  const [showBalanceModal, setShowBalanceModal] = useState(false);

  const loadUserData = () => {
    if (!userId) return;

    dispatch(fetchUserDetails(userId));

    // This requests page one of THIS user's history, with 40 records per page.
    // The selected user's full history is browsed from the dedicated
    // /dashboard/users/:userId/transactions screen, using pagination.
    dispatch(
      fetchTransactions({
        page: 1,
        limit: USER_TRANSACTIONS_PAGE_LIMIT,
        userId,
      })
    );
  };

  useEffect(() => {
    loadUserData();

    return () => {
      dispatch(resetBalanceUpdateStatus());
    };
    // userId determines which user is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, userId]);

  const portfolioData = useMemo(
    () => buildPortfolioSummary(userDetails || {}),
    [userDetails]
  );

  const adminStats = useMemo(
    () => buildAdminStats(userDetails || {}, userTransactions, totalTransactions),
    [userDetails, userTransactions, totalTransactions]
  );

  if (detailsStatus === 'loading') {
    return <Loading message="Loading user details..." />;
  }

  if (detailsStatus === 'failed') {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/dashboard/users')}
          className="mb-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2"
          type="button"
        >
          <ArrowLeft size={18} />
          Back to users
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error || 'Failed to load user details'}
        </div>
      </div>
    );
  }

  if (!userDetails) return null;

  const user = userDetails.user || {};

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/dashboard/users')}
            className="group rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:bg-slate-50"
            type="button"
          >
            <ArrowLeft className="text-slate-600 group-hover:text-slate-900" size={22} />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">User Details</h1>
            <p className="mt-1 text-slate-600">
              Admin overview of profile, wallet, transactions, and bank details
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={loadUserData}
            disabled={transactionsLoading}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
          >
            <RefreshCw size={18} className={transactionsLoading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={() => navigate(`/dashboard/users/${userId}/investments`)}
            className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 font-semibold text-violet-700 shadow-sm transition hover:bg-violet-100"
            type="button"
          >
            <ExternalLink size={18} />
            View Investments
          </button>

          <button
            onClick={() => setShowBalanceModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
            type="button"
          >
            <Wallet size={18} />
            {balanceUpdateStatus === 'loading' ? 'Updating...' : 'Update Balance'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <UserProfileCard user={user} />

        <UserBalanceCards user={user} portfolio={portfolioData} stats={adminStats} />

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Investments & Orders</h3>
              <p className="mt-1 text-sm text-slate-500">
                Open the separate page to inspect all investment records, statuses, returns, lock details, and order activity.
              </p>
            </div>

            <button
              onClick={() => navigate(`/dashboard/users/${userId}/investments`)}
              className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-violet-700"
              type="button"
            >
              <ExternalLink size={18} />
              Open Full Investments Page
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">View All Transactions</h3>
              <p className="mt-1 text-sm text-slate-500">
                Browse the complete transaction history with 40 records per page.
              </p>
            </div>

            <button
              onClick={() => navigate(`/dashboard/users/${userId}/transactions`)}
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100"
              type="button"
            >
              <ExternalLink size={18} />
              View Transactions
            </button>
          </div>
        </div>

        <UserBankDetails user={user} />
      </div>

      {showBalanceModal && (
        <UpdateBalanceModal
          userId={userId}
          onClose={() => setShowBalanceModal(false)}
          dispatch={dispatch}
          updateUserBalance={updateUserBalance}
          fetchUserDetails={fetchUserDetails}
        />
      )}
    </div>
  );
};

export default UserDetails;
