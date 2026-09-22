import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  RefreshCw,
  TrendingUp,
  Unlock,
} from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../../components/Loader";
import UserOrders from "../../components/Users/UserOrders";
import {
  fetchUserDetails,
  resetBalanceUpdateStatus,
} from "../../store/slices/usersSlice";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getStatus = (item = {}) =>
  String(item?.status || "pending")
    .trim()
    .toLowerCase();

const getInvestmentAmount = (item = {}) =>
  toNumber(
    item?.amount ??
      item?.principalAmount ??
      item?.investedAmount ??
      item?.totalAmount ??
      0,
  );

const getInvestmentInterest = (item = {}) =>
  toNumber(
    item?.totalInterestEarned ??
      item?.interestEarned ??
      item?.totalProfit ??
      item?.profit ??
      0,
  );

const getInvestmentCurrentValue = (item = {}) => {
  const explicitValue =
    item?.currentValue ??
    item?.currentAmount ??
    item?.maturityValue ??
    item?.totalValue;

  return explicitValue !== undefined && explicitValue !== null
    ? toNumber(explicitValue)
    : getInvestmentAmount(item) + getInvestmentInterest(item);
};

const getDailyReturn = (item = {}) =>
  toNumber(
    item?.dailyInterestAmount ??
      item?.dailyReturn ??
      item?.todayEarning ??
      item?.todayEarnings ??
      0,
  );

const buildPortfolioSummary = (userDetails = {}) => {
  const investments = Array.isArray(userDetails.investments)
    ? userDetails.investments
    : [];

  const buckets = {
    active: [],
    pending: [],
    unlocked: [],
    completed: [],
    closed: [],
    cancelled: [],
    other: [],
  };

  investments.forEach((item) => {
    const status = getStatus(item);

    if (status === "active") buckets.active.push(item);
    else if (["pending", "processing", "initiated"].includes(status)) {
      buckets.pending.push(item);
    } else if (status === "unlocked") buckets.unlocked.push(item);
    else if (["completed", "approved"].includes(status)) {
      buckets.completed.push(item);
    } else if (["closed", "closed_reinvested"].includes(status)) {
      buckets.closed.push(item);
    } else if (["cancelled", "rejected", "failed"].includes(status)) {
      buckets.cancelled.push(item);
    } else buckets.other.push(item);
  });

  const sumAmount = (items) =>
    items.reduce((sum, item) => sum + getInvestmentAmount(item), 0);

  const sumValue = (items) =>
    items.reduce((sum, item) => sum + getInvestmentCurrentValue(item), 0);

  const sumInterest = (items) =>
    items.reduce((sum, item) => sum + getInvestmentInterest(item), 0);

  const activeInvestmentMoney = sumAmount(buckets.active);
  const activeInvestmentValue = sumValue(buckets.active);
  const activeInvestmentInterest = sumInterest(buckets.active);
  const activeDailyReturn = buckets.active.reduce(
    (sum, item) => sum + getDailyReturn(item),
    0,
  );

  const completedInvestmentMoney = sumAmount(buckets.completed);
  const completedInvestmentValue = sumValue(buckets.completed);
  const completedInvestmentInterest = sumInterest(buckets.completed);

  const totalReturns =
    activeInvestmentInterest +
    completedInvestmentInterest +
    sumInterest(buckets.unlocked) +
    sumInterest(buckets.closed);

  return {
    statusBuckets: {
      all: investments.length,
      active: buckets.active.length,
      pending: buckets.pending.length,
      unlocked: buckets.unlocked.length,
      completed: buckets.completed.length,
      closed: buckets.closed.length,
      cancelled: buckets.cancelled.length,
      other: buckets.other.length,
    },

    moneyByStatus: {
      active: activeInvestmentMoney,
      pending: sumAmount(buckets.pending),
      unlocked: sumAmount(buckets.unlocked),
      completed: completedInvestmentMoney,
      closed: sumAmount(buckets.closed),
      cancelled: sumAmount(buckets.cancelled),
      other: sumAmount(buckets.other),
    },

    valueByStatus: {
      active: activeInvestmentValue,
      pending: sumValue(buckets.pending),
      unlocked: sumValue(buckets.unlocked),
      completed: completedInvestmentValue,
      closed: sumValue(buckets.closed),
      cancelled: sumValue(buckets.cancelled),
      other: sumValue(buckets.other),
    },

    interestByStatus: {
      active: activeInvestmentInterest,
      pending: 0,
      unlocked: sumInterest(buckets.unlocked),
      completed: completedInvestmentInterest,
      closed: sumInterest(buckets.closed),
      cancelled: 0,
      other: 0,
    },

    activeInvestmentMoney,
    activeInvestmentValue,
    activeInvestmentInterest,
    activeDailyReturn,

    completedInvestmentMoney,
    completedInvestmentValue,
    completedInvestmentInterest,

    totalReturns,
  };
};

const buildOrdersFromInvestments = (userDetails = {}) => {
  const safeOrders = userDetails.investmentOrders;

  if (safeOrders) {
    return {
      pending: Array.isArray(safeOrders.pending) ? safeOrders.pending : [],
      active: Array.isArray(safeOrders.active) ? safeOrders.active : [],
      unlocked: Array.isArray(safeOrders.unlocked) ? safeOrders.unlocked : [],
      completed: Array.isArray(safeOrders.completed)
        ? safeOrders.completed
        : [],
      cancelled: Array.isArray(safeOrders.cancelled)
        ? safeOrders.cancelled
        : [],
      all: Array.isArray(safeOrders.all) ? safeOrders.all : [],
    };
  }

  const investments = Array.isArray(userDetails.investments)
    ? userDetails.investments
    : [];

  const mapped = investments.map((item, index) => ({
    ...item,
    _id: item._id || `order-${index}`,
    orderId: item.orderId || item.orderNumber || item._id,
    indexName:
      item.indexName ||
      item.indexSnapshot?.name ||
      item.index?.name ||
      item.indexId?.name ||
      item.planName ||
      "-",
    amount: getInvestmentAmount(item),
    totalInterestEarned: getInvestmentInterest(item),
    dailyInterestAmount: getDailyReturn(item),
    status: item.status || "pending",
  }));

  return {
    pending: mapped.filter((item) =>
      ["pending", "processing", "initiated"].includes(getStatus(item)),
    ),
    active: mapped.filter((item) => getStatus(item) === "active"),
    unlocked: mapped.filter((item) => getStatus(item) === "unlocked"),
    completed: mapped.filter((item) =>
      ["completed", "approved", "closed", "closed_reinvested"].includes(
        getStatus(item),
      ),
    ),
    cancelled: mapped.filter((item) =>
      ["cancelled", "rejected", "failed"].includes(getStatus(item)),
    ),
    all: mapped,
  };
};

const TopCard = ({ title, value, note, icon: Icon, tone = "blue" }) => {
  const toneMap = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    violet: "bg-violet-50 border-violet-100 text-violet-700",
    orange: "bg-orange-50 border-orange-100 text-orange-700",
  };

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        toneMap[tone] || toneMap.blue
      }`}
    >
      <div className="mb-3 rounded-xl bg-white/80 p-3 shadow-sm w-fit">
        <Icon size={20} />
      </div>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-2 text-xs opacity-80">{note}</p>
    </div>
  );
};

const MoneyBreakdownCard = ({
  title,
  count,
  amount,
  value,
  interest,
  dailyReturn,
  icon: Icon,
  tone,
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between">
      <div className={`rounded-xl p-3 ${tone}`}>
        <Icon size={20} />
      </div>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        {count} investments
      </span>
    </div>

    <p className="text-sm font-semibold text-slate-700">{title}</p>
    <p className="mt-2 text-2xl font-bold text-slate-900">
      {formatCurrency(amount)}
    </p>

    <div className="mt-3 space-y-1 text-xs text-slate-500">
      <p>
        Current value:{" "}
        <span className="font-semibold text-slate-700">
          {formatCurrency(value)}
        </span>
      </p>
      <p>
        Interest earned:{" "}
        <span className="font-semibold text-emerald-600">
          {formatCurrency(interest)}
        </span>
      </p>
      {dailyReturn !== undefined ? (
        <p>
          Daily return:{" "}
          <span className="font-semibold text-amber-600">
            {formatCurrency(dailyReturn)}
          </span>
        </p>
      ) : null}
    </div>
  </div>
);

const UserInvestmentsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userDetails, detailsStatus, error } = useSelector(
    (state) => state.users,
  );

  const loadUserDetails = useCallback(() => {
    if (userId) dispatch(fetchUserDetails(userId));
  }, [dispatch, userId]);

  useEffect(() => {
    loadUserDetails();
    return () => dispatch(resetBalanceUpdateStatus());
  }, [dispatch, loadUserDetails]);

  const portfolioData = useMemo(
    () => buildPortfolioSummary(userDetails || {}),
    [userDetails],
  );

  const ordersData = useMemo(
    () => buildOrdersFromInvestments(userDetails || {}),
    [userDetails],
  );

  if (detailsStatus === "loading") {
    return <Loading message="Loading investments and orders..." />;
  }

  if (detailsStatus === "failed") {
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
          {error || "Failed to load user investments"}
        </div>
      </div>
    );
  }

  if (!userDetails) return null;

  const user = userDetails.user || {};
  const { statusBuckets, moneyByStatus, valueByStatus, interestByStatus } =
    portfolioData;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(`/dashboard/users/${userId}`)}
            className="group rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:bg-slate-50"
            type="button"
          >
            <ArrowLeft
              className="text-slate-600 group-hover:text-slate-900"
              size={22}
            />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Investments & Orders
            </h1>
            <p className="mt-1 text-slate-600">
              Separate investment status and returns for{" "}
              {user.fullName || user.name || "this user"}
            </p>
          </div>
        </div>

        <button
          onClick={loadUserDetails}
          disabled={detailsStatus === "loading"}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
        >
          <RefreshCw
            size={18}
            className={detailsStatus === "loading" ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MoneyBreakdownCard
          title="Active Investment Money"
          count={statusBuckets.active}
          amount={moneyByStatus.active}
          value={valueByStatus.active}
          interest={interestByStatus.active}
          dailyReturn={portfolioData.activeDailyReturn}
          icon={TrendingUp}
          tone="bg-emerald-100 text-emerald-700"
        />

        <MoneyBreakdownCard
          title="Completed Investment Money"
          count={statusBuckets.completed}
          amount={moneyByStatus.completed}
          value={valueByStatus.completed}
          interest={interestByStatus.completed}
          icon={CheckCircle2}
          tone="bg-violet-100 text-violet-700"
        />

        <MoneyBreakdownCard
          title="Unlocked Investment Money"
          count={statusBuckets.unlocked}
          amount={moneyByStatus.unlocked}
          value={valueByStatus.unlocked}
          interest={interestByStatus.unlocked}
          icon={Unlock}
          tone="bg-blue-100 text-blue-700"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <TopCard
          title="Completed Investment Interest"
          value={formatCurrency(portfolioData.completedInvestmentInterest)}
          note="Interest from completed investments only"
          icon={CheckCircle2}
          tone="violet"
        />
        <TopCard
          title="Total Returns"
          value={formatCurrency(portfolioData.totalReturns)}
          note="Interest from active, completed, unlocked, and closed investments"
          icon={CircleDollarSign}
          tone="blue"
        />
        <TopCard
          title="Active Daily Return"
          value={formatCurrency(portfolioData.activeDailyReturn)}
          note="Active investments only"
          icon={ArrowUpRight}
          tone="orange"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2"></div>

      <UserOrders orders={ordersData} />
    </div>
  );
};

export default UserInvestmentsPage;
