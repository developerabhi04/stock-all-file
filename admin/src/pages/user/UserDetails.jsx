import { ArrowLeft, ExternalLink, RefreshCw, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../../components/Loader";
import { adminAPI } from "../../services/api";
// import { fetchTransactions } from "../../store/slices/transactionsSlice";
import {
  fetchUserDetails,
  resetBalanceUpdateStatus,
  updateUserBalance,
} from "../../store/slices/usersSlice";

import UpdateBalanceModal from "../../components/Users/UpdateBalanceModal";
import UserBalanceCards from "../../components/Users/UserBalanceCards";
import UserBankDetails from "../../components/Users/UserBankDetails";
import UserProfileCard from "../../components/Users/UserProfileCard";

const USER_TRANSACTIONS_PAGE_LIMIT = 1000;

const COMPLETED_TRANSACTION_STATUSES = ["completed", "success", "approved"];
const COMPLETED_INVESTMENT_STATUSES = ["completed", "approved"];

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getInvestmentAmount = (investment = {}) => {
  return toNumber(
    investment.amount ??
      investment.principalAmount ??
      investment.investedAmount ??
      investment.totalAmount ??
      0,
  );
};

const getInvestmentReturn = (investment = {}) => {
  return toNumber(
    investment.totalInterestEarned ??
      investment.interestEarned ??
      investment.totalReturn ??
      investment.profit ??
      0,
  );
};

const getTodayInvestmentEarning = (investment = {}) => {
  return toNumber(
    investment.dailyInterestAmount ??
      investment.todayEarning ??
      investment.todayEarnings ??
      investment.dailyReturn ??
      0,
  );
};

const getStatus = (item = {}) =>
  String(item.status || "")
    .trim()
    .toLowerCase();

const isCompletedTransaction = (transaction = {}) =>
  COMPLETED_TRANSACTION_STATUSES.includes(getStatus(transaction));

const isActiveInvestment = (investment = {}) =>
  getStatus(investment) === "active";

const isCompletedInvestment = (investment = {}) =>
  COMPLETED_INVESTMENT_STATUSES.includes(getStatus(investment));

/*
  Portfolio logic:
  - Active Investment: only status = active
  - Completed Investment Money: status = completed or approved
  - Today's Earnings: only active investments
  - Total Returns: active + completed investments only
  - Unlocked / cancelled / rejected / failed / closed investments are excluded
*/
const buildPortfolioSummary = (userDetails = {}) => {
  const investments = Array.isArray(userDetails.investments)
    ? userDetails.investments
    : [];

  const activeInvestments = investments.filter(isActiveInvestment);

  const completedInvestments = investments.filter(isCompletedInvestment);

  const activeInvested = activeInvestments.reduce(
    (sum, investment) => sum + getInvestmentAmount(investment),
    0,
  );

  const completedInvested = completedInvestments.reduce(
    (sum, investment) => sum + getInvestmentAmount(investment),
    0,
  );

  const todayPnL = activeInvestments.reduce(
    (sum, investment) => sum + getTodayInvestmentEarning(investment),
    0,
  );

  const totalPnL = [...activeInvestments, ...completedInvestments].reduce(
    (sum, investment) => sum + getInvestmentReturn(investment),
    0,
  );

  return {
    activeInvested,
    activeInvestmentsCount: activeInvestments.length,

    completedInvested,
    completedInvestmentsCount: completedInvestments.length,

    todayPnL,
    totalPnL,
  };
};

/*
  Transaction logic:
  - Total Added Money: only completed add_money credits
  - Total Withdrawals: only completed withdrawal debits
  - Total Transactions: all transactions returned by backend
*/
const buildAdminStats = (
  userDetails = {},
  pageTransactions = [],
  totalTransactions = 0,
) => {
  const user = userDetails.user || {};
  const txns = Array.isArray(pageTransactions) ? pageTransactions : [];

  const addedMoneyTransactions = txns.filter((transaction) => {
    const status = String(transaction.status || "").toLowerCase();
    const category = String(transaction.category || "").toLowerCase();
    const type = String(transaction.type || "").toLowerCase();

    return (
      category === "add_money" &&
      type === "credit" &&
      ["completed", "success", "approved"].includes(status)
    );
  });

  const withdrawalTransactions = txns.filter((transaction) => {
    const status = String(transaction.status || "").toLowerCase();
    const category = String(transaction.category || "").toLowerCase();
    const type = String(transaction.type || "").toLowerCase();

    return (
      category === "withdrawal" &&
      type === "debit" &&
      ["completed", "success", "approved"].includes(status)
    );
  });

  const totalAddedMoney = addedMoneyTransactions.reduce(
    (sum, transaction) => sum + Math.abs(Number(transaction.amount || 0)),
    0,
  );

  const totalWithdrawals = withdrawalTransactions.reduce(
    (sum, transaction) => sum + Math.abs(Number(transaction.amount || 0)),
    0,
  );

  return {
    walletBalance: Number(user.walletBalance || 0),

    totalTransactions: Number(totalTransactions || txns.length),

    totalAddedMoney,
    addedMoneyCount: addedMoneyTransactions.length,

    totalWithdrawals,
    withdrawalCount: withdrawalTransactions.length,
  };
};

const UserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userDetails, detailsStatus, balanceUpdateStatus, error } =
    useSelector((state) => state.users);

  // const {
  //   transactions: userTransactions = [],
  //   loading: transactionsLoading,
  //   totalTransactions,
  // } = useSelector((state) => state.transactions);

  const [userTransactions, setUserTransactions] = useState([]);
  const [userTransactionCount, setUserTransactionCount] = useState(0);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState("");

  const [showBalanceModal, setShowBalanceModal] = useState(false);

  const loadUserData = useCallback(async () => {
    if (!userId) return;

    dispatch(fetchUserDetails(userId));

    setTransactionsLoading(true);
    setTransactionsError("");

    try {
      const response = await adminAPI.getAllTransactions({
        page: 1,
        limit: USER_TRANSACTIONS_PAGE_LIMIT,
        userId,
      });

      const data = response.data?.data || {};

      const transactions = Array.isArray(data.transactions)
        ? data.transactions
        : [];

      setUserTransactions(transactions);

      setUserTransactionCount(
        Number(data.totalTransactions || transactions.length || 0),
      );

      console.log("USER DETAILS TRANSACTION RESULT:", {
        userId,
        loaded: transactions.length,
        total: data.totalTransactions,
        limit: data.limit,
      });
    } catch (requestError) {
      console.error(
        "User transaction request failed:",
        requestError.response?.data || requestError.message,
      );

      setUserTransactions([]);
      setUserTransactionCount(0);
      setTransactionsError(
        requestError.response?.data?.message ||
          "Failed to load user transactions",
      );
    } finally {
      setTransactionsLoading(false);
    }
  }, [dispatch, userId]);

  useEffect(() => {
    loadUserData();

    return () => {
      dispatch(resetBalanceUpdateStatus());
    };
  }, [dispatch, loadUserData]);

  const portfolioData = useMemo(
    () => buildPortfolioSummary(userDetails || {}),
    [userDetails],
  );

  const adminStats = useMemo(
    () =>
      buildAdminStats(
        userDetails || {},
        userTransactions,
        userTransactionCount,
      ),
    [userDetails, userTransactions, userTransactionCount],
  );

  if (detailsStatus === "loading") {
    return <Loading message="Loading user details..." />;
  }

  if (detailsStatus === "failed") {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate("/dashboard/users")}
          className="mb-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2"
          type="button"
        >
          <ArrowLeft size={18} />
          Back to users
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error || "Failed to load user details"}
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
            onClick={() => navigate("/dashboard/users")}
            className="group rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:bg-slate-50"
            type="button"
          >
            <ArrowLeft
              className="text-slate-600 group-hover:text-slate-900"
              size={22}
            />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">User Details</h1>

            <p className="mt-1 text-slate-600">
              Wallet activity, completed deposits, withdrawals, and investments
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
            <RefreshCw
              size={18}
              className={transactionsLoading ? "animate-spin" : ""}
            />
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
            {balanceUpdateStatus === "loading"
              ? "Updating..."
              : "Update Balance"}
          </button>
        </div>
      </div>

      {transactionsError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {transactionsError}
        </div>
      ) : null}

      <div className="space-y-6">
        <UserProfileCard user={user} />

        <UserBalanceCards
          user={user}
          portfolio={portfolioData}
          stats={adminStats}
        />

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Investments & Orders
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                View individual investment records, status, lock period, return,
                and order activity.
              </p>
            </div>

            <button
              onClick={() => navigate(`/dashboard/users/${userId}/investments`)}
              className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-violet-700"
              type="button"
            >
              <ExternalLink size={18} />
              Open Investments
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Transaction History
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                View deposits, withdrawals, investment transactions, and payment
                statuses.
              </p>
            </div>

            <button
              onClick={() =>
                navigate(`/dashboard/users/${userId}/transactions`)
              }
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
          currentBalance={user.walletBalance || 0}
          userName={user.fullName || ""}
          onClose={() => {
            setShowBalanceModal(false);
            loadUserData();
          }}
          dispatch={dispatch}
          updateUserBalance={updateUserBalance}
          fetchUserDetails={fetchUserDetails}
        />
      )}
    </div>
  );
};

export default UserDetails;
