import { useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUserDetails,
  resetBalanceUpdateStatus,
} from '../../store/slices/usersSlice';
import {
  ArrowLeft,
  RefreshCw,
  Layers3,
  ArrowUpRight,
  Wallet,
  Clock3,
  CheckCircle2,
  Ban,
  Unlock,
  TrendingUp,
  CircleDollarSign,
  LockKeyhole,
  RotateCcw,
  Banknote,
} from 'lucide-react';
import Loading from '../../components/Loader';
import UserOrders from '../../components/Users/UserOrders';

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getStatus = (item) => String(item?.status || 'pending').toLowerCase();

const getInvestmentAmount = (item) =>
  toNumber(item?.amount ?? item?.principalAmount ?? item?.investedAmount ?? item?.totalAmount);

const getInvestmentCurrentValue = (item) => {
  const explicitValue =
    item?.currentValue ??
    item?.currentAmount ??
    item?.maturityValue ??
    item?.totalValue;

  if (explicitValue !== undefined && explicitValue !== null) {
    return toNumber(explicitValue);
  }

  return getInvestmentAmount(item) + toNumber(item?.totalInterestEarned);
};

const getInvestmentInterest = (item) =>
  toNumber(
    item?.totalInterestEarned ??
      item?.interestEarned ??
      item?.totalProfit ??
      item?.profit
  );

const buildPortfolioSummary = (userDetails = {}) => {
  const backendPortfolio = userDetails.portfolioSummary || {};
  const investments = Array.isArray(userDetails.investments)
    ? userDetails.investments
    : [];

  const buckets = {
    all: [],
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
    buckets.all.push(item);

    if (['pending', 'processing', 'initiated'].includes(status)) {
      buckets.pending.push(item);
    } else if (status === 'active') {
      buckets.active.push(item);
    } else if (status === 'unlocked') {
      buckets.unlocked.push(item);
    } else if (['completed', 'approved'].includes(status)) {
      buckets.completed.push(item);
    } else if (['closed', 'closed_reinvested'].includes(status)) {
      buckets.closed.push(item);
    } else if (['cancelled', 'rejected', 'failed'].includes(status)) {
      buckets.cancelled.push(item);
    } else {
      buckets.other.push(item);
    }
  });

  const sumAmount = (items) =>
    items.reduce((sum, item) => sum + getInvestmentAmount(item), 0);

  const sumCurrentValue = (items) =>
    items.reduce((sum, item) => sum + getInvestmentCurrentValue(item), 0);

  const sumInterest = (items) =>
    items.reduce((sum, item) => sum + getInvestmentInterest(item), 0);

  const totalInvested =
    backendPortfolio.totalInvested ??
    backendPortfolio.totalPrincipalInvested ??
    sumAmount(buckets.all);

  const activeInvested = sumAmount(buckets.active);
  const pendingInvested = sumAmount(buckets.pending);
  const unlockedInvested = sumAmount(buckets.unlocked);
  const completedInvested = sumAmount(buckets.completed);
  const closedInvested = sumAmount(buckets.closed);
  const cancelledInvested = sumAmount(buckets.cancelled);

  const activeCurrentValue = sumCurrentValue(buckets.active);
  const pendingCurrentValue = sumCurrentValue(buckets.pending);
  const unlockedCurrentValue = sumCurrentValue(buckets.unlocked);
  const completedCurrentValue = sumCurrentValue(buckets.completed);
  const closedCurrentValue = sumCurrentValue(buckets.closed);
  const cancelledCurrentValue = sumCurrentValue(buckets.cancelled);

  const totalCurrentValue =
    backendPortfolio.currentValue ??
    backendPortfolio.totalCurrentValue ??
    sumCurrentValue(buckets.all);

  const totalInterestEarned =
    backendPortfolio.totalInterestEarned ??
    backendPortfolio.totalInterest ??
    sumInterest(buckets.all);

  const activeInterest = sumInterest(buckets.active);
  const completedInterest = sumInterest(buckets.completed);
  const unlockedInterest = sumInterest(buckets.unlocked);
  const closedInterest = sumInterest(buckets.closed);

  const totalPnL =
    backendPortfolio.totalPnL ??
    backendPortfolio.totalProfit ??
    totalCurrentValue - Number(totalInvested || 0);

  const totalPnLPercent =
    backendPortfolio.totalPnLPercent ??
    (Number(totalInvested || 0) > 0
      ? (Number(totalPnL || 0) / Number(totalInvested)) * 100
      : 0);

  const todayPnL =
    backendPortfolio.todayPnL ??
    backendPortfolio.totalDailyEarning ??
    investments.reduce(
      (sum, item) => sum + toNumber(item?.dailyInterestAmount ?? item?.dailyReturn),
      0
    );

  return {
    totalInvested: toNumber(totalInvested),
    totalCurrentValue: toNumber(totalCurrentValue),
    currentValue: toNumber(totalCurrentValue),
    totalInterestEarned: toNumber(totalInterestEarned),
    totalPnL: toNumber(totalPnL),
    totalPnLPercent: toNumber(totalPnLPercent),
    todayPnL: toNumber(todayPnL),

    statusBuckets: {
      all: buckets.all.length,
      active: buckets.active.length,
      pending: buckets.pending.length,
      unlocked: buckets.unlocked.length,
      completed: buckets.completed.length,
      closed: buckets.closed.length,
      cancelled: buckets.cancelled.length,
      other: buckets.other.length,
    },

    moneyByStatus: {
      active: activeInvested,
      pending: pendingInvested,
      unlocked: unlockedInvested,
      completed: completedInvested,
      closed: closedInvested,
      cancelled: cancelledInvested,
      other: sumAmount(buckets.other),
    },

    valueByStatus: {
      active: activeCurrentValue,
      pending: pendingCurrentValue,
      unlocked: unlockedCurrentValue,
      completed: completedCurrentValue,
      closed: closedCurrentValue,
      cancelled: cancelledCurrentValue,
    },

    interestByStatus: {
      active: activeInterest,
      unlocked: unlockedInterest,
      completed: completedInterest,
      closed: closedInterest,
    },
  };
};

const buildOrdersFromInvestments = (userDetails = {}) => {
  const safeOrders = userDetails.investmentOrders;

  if (safeOrders) {
    return {
      pending: Array.isArray(safeOrders.pending) ? safeOrders.pending : [],
      active: Array.isArray(safeOrders.active) ? safeOrders.active : [],
      unlocked: Array.isArray(safeOrders.unlocked) ? safeOrders.unlocked : [],
      completed: Array.isArray(safeOrders.completed) ? safeOrders.completed : [],
      cancelled: Array.isArray(safeOrders.cancelled) ? safeOrders.cancelled : [],
      all: Array.isArray(safeOrders.all) ? safeOrders.all : [],
    };
  }

  const investments = Array.isArray(userDetails.investments)
    ? userDetails.investments
    : [];

  const mapped = investments.map((item, index) => ({
    _id: item._id || `order-${index}`,
    orderId: item.orderId || item.orderNumber || item._id,
    type: item.type || item.action || 'buy',
    indexName:
      item.indexName ||
      item.indexSnapshot?.name ||
      item.index?.name ||
      item.indexId?.name ||
      item.planName ||
      '-',
    symbol:
      item.symbol ||
      item.indexSnapshot?.symbol ||
      item.index?.symbol ||
      item.indexId?.symbol ||
      '',
    quantity: toNumber(item.quantity || item.units || 1),
    price:
      toNumber(item.price || item.unitPrice) ||
      getInvestmentAmount(item) / Math.max(toNumber(item.quantity || item.units || 1), 1),
    totalAmount: toNumber(item.totalAmount || item.amount),
    orderDate: item.orderDate || item.orderPlacedAt || item.createdAt || null,
    status: item.status || 'pending',
    reason: item.reason || item.rejectionReason || '',
    amount: getInvestmentAmount(item),
    totalInterestEarned: getInvestmentInterest(item),
    dailyInterestAmount: toNumber(item.dailyInterestAmount || item.dailyReturn),
    effectiveDailyRate: toNumber(item.effectiveDailyRate || item.dailyRate || item.returnRate),
    daysCompleted: toNumber(item.daysCompleted),
    daysRemaining: toNumber(item.daysRemaining),
    lockPeriodDays: toNumber(item.lockPeriodDays),
    isLockCompleted: Boolean(item.isLockCompleted),
  }));

  return {
    pending: mapped.filter((item) => ['pending', 'processing', 'initiated'].includes(getStatus(item))),
    active: mapped.filter((item) => getStatus(item) === 'active'),
    unlocked: mapped.filter((item) => getStatus(item) === 'unlocked'),
    completed: mapped.filter((item) => ['completed', 'approved', 'closed', 'closed_reinvested'].includes(getStatus(item))),
    cancelled: mapped.filter((item) => ['cancelled', 'rejected', 'failed'].includes(getStatus(item))),
    all: mapped,
  };
};

const TopCard = ({ title, value, note, icon: Icon, tone = 'blue' }) => {
  const toneMap = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    violet: 'bg-violet-50 border-violet-100 text-violet-700',
    orange: 'bg-orange-50 border-orange-100 text-orange-700',
    red: 'bg-red-50 border-red-100 text-red-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneMap[tone] || toneMap.blue}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-xl bg-white/80 p-3 shadow-sm">
          <Icon size={20} />
        </div>
      </div>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-2 text-xs opacity-80">{note}</p>
    </div>
  );
};

const MoneyBreakdownCard = ({ title, count, amount, value, interest, icon: Icon, tone }) => (
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
    <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(amount)}</p>
    <div className="mt-3 space-y-1 text-xs text-slate-500">
      <p>Current value: <span className="font-semibold text-slate-700">{formatCurrency(value)}</span></p>
      <p>Interest earned: <span className="font-semibold text-emerald-600">{formatCurrency(interest)}</span></p>
    </div>
  </div>
);

const UserInvestmentsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userDetails, detailsStatus, error } = useSelector((state) => state.users);

  const loadUserDetails = useCallback(() => {
    if (userId) dispatch(fetchUserDetails(userId));
  }, [dispatch, userId]);

  useEffect(() => {
    loadUserDetails();

    return () => {
      dispatch(resetBalanceUpdateStatus());
    };
  }, [dispatch, loadUserDetails]);

  const portfolioData = useMemo(
    () => buildPortfolioSummary(userDetails || {}),
    [userDetails]
  );

  const ordersData = useMemo(
    () => buildOrdersFromInvestments(userDetails || {}),
    [userDetails]
  );

  if (detailsStatus === 'loading') {
    return <Loading message="Loading investments and orders..." />;
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
          {error || 'Failed to load user investments'}
        </div>
      </div>
    );
  }

  if (!userDetails) return null;

  const user = userDetails.user || {};
  const { statusBuckets, moneyByStatus, valueByStatus, interestByStatus } = portfolioData;

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
            <h1 className="text-3xl font-bold text-slate-900">Investments & Orders</h1>
            <p className="mt-1 text-slate-600">
              Full investment activity for {user.fullName || user.name || 'this user'}
            </p>
          </div>
        </div>

        <button
          onClick={loadUserDetails}
          disabled={detailsStatus === 'loading'}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
        >
          <RefreshCw size={18} className={detailsStatus === 'loading' ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TopCard
          title="Total Invested"
          value={formatCurrency(portfolioData.totalInvested)}
          note={`${statusBuckets.all} total investments`}
          icon={Wallet}
          tone="emerald"
        />
        <TopCard
          title="Total Current Value"
          value={formatCurrency(portfolioData.totalCurrentValue)}
          note={`All investment positions combined`}
          icon={Layers3}
          tone="blue"
        />
        <TopCard
          title="Total Return"
          value={formatCurrency(portfolioData.totalPnL)}
          note={`${portfolioData.totalPnLPercent.toFixed(2)}% overall return`}
          icon={TrendingUp}
          tone="violet"
        />
        <TopCard
          title="Today Earnings"
          value={formatCurrency(portfolioData.todayPnL)}
          note="Daily earnings across investments"
          icon={ArrowUpRight}
          tone="orange"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MoneyBreakdownCard
          title="Active Investment Money"
          count={statusBuckets.active}
          amount={moneyByStatus.active}
          value={valueByStatus.active}
          interest={interestByStatus.active}
          icon={TrendingUp}
          tone="bg-emerald-100 text-emerald-700"
        />
        <MoneyBreakdownCard
          title="Pending Investment Money"
          count={statusBuckets.pending}
          amount={moneyByStatus.pending}
          value={valueByStatus.pending}
          interest={0}
          icon={Clock3}
          tone="bg-amber-100 text-amber-700"
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
          title="Closed Investment Money"
          count={statusBuckets.closed}
          amount={moneyByStatus.closed}
          value={valueByStatus.closed}
          interest={interestByStatus.closed}
          icon={LockKeyhole}
          tone="bg-slate-200 text-slate-700"
        />
        <MoneyBreakdownCard
          title="Cancelled / Failed Money"
          count={statusBuckets.cancelled}
          amount={moneyByStatus.cancelled}
          value={valueByStatus.cancelled}
          interest={0}
          icon={Ban}
          tone="bg-red-100 text-red-700"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <TopCard
          title="Total Interest Earned"
          value={formatCurrency(portfolioData.totalInterestEarned)}
          note="Interest across all investment statuses"
          icon={CircleDollarSign}
          tone="emerald"
        />
        <TopCard
          title="Active + Unlocked Money"
          value={formatCurrency(moneyByStatus.active + moneyByStatus.unlocked)}
          note={`${statusBuckets.active + statusBuckets.unlocked} active/unlocked investments`}
          icon={Banknote}
          tone="blue"
        />
        <TopCard
          title="Completed + Closed Money"
          value={formatCurrency(moneyByStatus.completed + moneyByStatus.closed)}
          note={`${statusBuckets.completed + statusBuckets.closed} completed/closed investments`}
          icon={RotateCcw}
          tone="violet"
        />
      </div>

      <UserOrders orders={ordersData} />
    </div>
  );
};

export default UserInvestmentsPage;