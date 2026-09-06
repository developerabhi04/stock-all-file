import { useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUserDetails,
  resetBalanceUpdateStatus,
} from '../../store/slices/usersSlice';
import {
  clearTransactions,
  fetchTransactions,
  setFilters,
  setPage,
} from '../../store/slices/transactionsSlice';
import {
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import Loading from '../../components/Loader';

import UserTransactions from '../../components/Users/UserTransactions';

const USER_TRANSACTIONS_PAGE_LIMIT = 40;

const EMPTY_TRANSACTION_FILTERS = {
  status: '',
  category: '',
  startDate: '',
  endDate: '',
};

const UserTransactionsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userDetails, detailsStatus, error: userError } = useSelector(
    (state) => state.users
  );

  const {
    transactions: userTransactions = [],
    loading: transactionsLoading,
    isFetching: transactionsFetching,
    currentPage = 1,
    totalPages = 0,
    totalTransactions = 0,
    limit = USER_TRANSACTIONS_PAGE_LIMIT,
    filters = EMPTY_TRANSACTION_FILTERS,
    error: transactionsError,
  } = useSelector((state) => state.transactions);

  // One request function for every user-transaction request. It ALWAYS carries
  // this user's id, so filters/pagination never fall back to platform-wide data.
  const loadTransactions = useCallback(
    ({
      page = 1,
      nextFilters = filters,
      nextLimit = USER_TRANSACTIONS_PAGE_LIMIT,
    } = {}) => {
      if (!userId) return;

      dispatch(
        fetchTransactions({
          page,
          limit: nextLimit,
          userId,
          status: nextFilters.status || '',
          category: nextFilters.category || '',
          startDate: nextFilters.startDate || '',
          endDate: nextFilters.endDate || '',
        })
      );
    },
    [dispatch, filters, userId]
  );

  useEffect(() => {
    if (!userId) return undefined;

    // The transactions slice is also used by the global All Transactions page.
    // Clear its old rows and clear old global/user filters before loading a new user.
    dispatch(clearTransactions());
    dispatch(setFilters(EMPTY_TRANSACTION_FILTERS));
    dispatch(fetchUserDetails(userId));

    dispatch(
      fetchTransactions({
        page: 1,
        limit: USER_TRANSACTIONS_PAGE_LIMIT,
        userId,
        ...EMPTY_TRANSACTION_FILTERS,
      })
    );

    return () => {
      dispatch(resetBalanceUpdateStatus());
    };
  }, [dispatch, userId]);

  const handlePageChange = (page) => {
    if (
      transactionsFetching ||
      page < 1 ||
      page > totalPages ||
      page === currentPage
    ) {
      return;
    }

    dispatch(setPage(page));
    loadTransactions({ page, nextFilters: filters, nextLimit: limit });
  };

  // Called by UserTransactions when status/category/from-date/to-date changes.
  // It resets to page 1 and sends filters + userId to the backend.
  const handleFiltersChange = (nextFilters) => {
    if (transactionsFetching) return;

    const safeFilters = {
      status: nextFilters.status || '',
      category: nextFilters.category || '',
      startDate: nextFilters.startDate || '',
      endDate: nextFilters.endDate || '',
    };

    dispatch(setFilters(safeFilters));

    // Do not depend on Redux rendering before making the request. Pass
    // safeFilters directly, otherwise the API can receive the previous filter.
    loadTransactions({
      page: 1,
      nextFilters: safeFilters,
      nextLimit: USER_TRANSACTIONS_PAGE_LIMIT,
    });
  };

  const handleRefresh = () => {
    if (!userId || transactionsFetching) return;

    dispatch(fetchUserDetails(userId));
    loadTransactions({
      page: currentPage || 1,
      nextFilters: filters,
      nextLimit: limit || USER_TRANSACTIONS_PAGE_LIMIT,
    });
  };

  if (detailsStatus === 'loading') {
    return <Loading message="Loading user transactions..." />;
  }

  if (detailsStatus === 'failed') {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(`/dashboard/users/${userId}`)}
          className="mb-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2"
          type="button"
        >
          <ArrowLeft size={18} />
          Back to user details
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {userError || 'Failed to load user details'}
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
            onClick={() => navigate(`/dashboard/users/${userId}`)}
            className="group rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:bg-slate-50"
            type="button"
          >
            <ArrowLeft className="text-slate-600 group-hover:text-slate-900" size={22} />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">Transactions</h1>
            <p className="mt-1 text-slate-600">
              Full transaction history for {user.fullName || user.name || 'this user'}
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={transactionsFetching}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
        >
          <RefreshCw size={18} className={transactionsFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {transactionsError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {transactionsError}
        </div>
      )}

      {transactionsLoading && userTransactions.length === 0 ? (
        <Loading message="Loading transactions..." />
      ) : (
        <UserTransactions
          transactions={userTransactions}
          currentPage={currentPage}
          totalPages={totalPages}
          totalTransactions={totalTransactions}
          limit={limit || USER_TRANSACTIONS_PAGE_LIMIT}
          isFetching={transactionsFetching}
          filters={filters}
          onPageChange={handlePageChange}
          onFiltersChange={handleFiltersChange}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
};

export default UserTransactionsPage;