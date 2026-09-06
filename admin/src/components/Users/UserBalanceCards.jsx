import {
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  BadgeIndianRupee,
  Layers3,
  PiggyBank,
  Scale,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;

const OverviewCard = ({ title, value, note, icon: Icon, tone = 'blue' }) => {
  const toneMap = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
    orange: 'border-orange-100 bg-orange-50 text-orange-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    red: 'border-red-100 bg-red-50 text-red-700',
  };

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        toneMap[tone] || toneMap.blue
      }`}
    >
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

const DetailCard = ({
  title,
  value,
  note,
  icon: Icon,
  iconWrap,
  noteClass,
  trendIcon: TrendIcon,
  trendClass,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div className={`rounded-2xl p-3 ${iconWrap}`}>
          <Icon size={22} />
        </div>

        {TrendIcon && <TrendIcon className={trendClass} size={18} />}
      </div>

      <p className="text-sm text-slate-500">{title}</p>

      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>

      <p className={`mt-2 text-xs font-medium ${noteClass}`}>{note}</p>
    </div>
  );
};

const UserBalanceCards = ({ user = {}, portfolio = {}, stats = {} }) => {
  const walletBalance = Number(
    stats.walletBalance ?? user.walletBalance ?? 0
  );

  const totalInvested = Number(
    portfolio.totalInvested ??
      portfolio.totalPrincipalInvested ??
      0
  );

  const currentValue = Number(
    portfolio.currentValue ??
      portfolio.totalCurrentValue ??
      0
  );

  const totalPnL = Number(
    portfolio.totalPnL ??
      portfolio.totalInterestEarned ??
      currentValue - totalInvested
  );

  const totalPnLPercent = Number(
    portfolio.totalPnLPercent ??
      (totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0)
  );

  const todayPnL = Number(
    portfolio.todayPnL ??
      portfolio.totalDailyEarning ??
      0
  );

  const statusBuckets = portfolio.statusBuckets || {};
  const moneyByStatus = portfolio.moneyByStatus || {};

  /*
    Supports both formats:

    Old UserDetails format:
    portfolio.activeInvested
    portfolio.activeInvestmentsCount
    portfolio.completedInvested
    portfolio.completedInvestmentsCount

    New UserInvestmentsPage format:
    portfolio.moneyByStatus.active
    portfolio.moneyByStatus.completed
    portfolio.statusBuckets.active
    portfolio.statusBuckets.completed
  */
  const activeInvestmentMoney = Number(
    portfolio.activeInvested ??
      moneyByStatus.active ??
      0
  );

  const completedInvestmentMoney = Number(
    portfolio.completedInvested ??
      moneyByStatus.completed ??
      0
  );

  const activeInvestmentCount = Number(
    portfolio.activeInvestmentsCount ??
      statusBuckets.active ??
      0
  );

  const completedInvestmentCount = Number(
    portfolio.completedInvestmentsCount ??
      statusBuckets.completed ??
      0
  );

  const unlockedInvestmentMoney = Number(
    moneyByStatus.unlocked ?? 0
  );

  const unlockedInvestmentCount = Number(
    statusBuckets.unlocked ?? 0
  );

  const totalDeposits = Number(stats.totalDeposits ?? 0);
  const totalWithdrawals = Number(stats.totalWithdrawals ?? 0);

  const principalInSystem = Number(
    stats.principalInSystem ??
      walletBalance + totalInvested
  );

  const totalTransactions = Number(stats.totalTransactions ?? 0);
  const totalCredits = Number(stats.totalCredits ?? 0);
  const totalDebits = Number(stats.totalDebits ?? 0);

  const isProfit = totalPnL >= 0;
  const isTodayProfit = todayPnL >= 0;

  const detailCards = [
    {
      title: 'Portfolio Value',
      value: formatCurrency(currentValue),
      note: `${activeInvestmentCount} active investments · ${formatCurrency(
        activeInvestmentMoney
      )}`,
      icon: Activity,
      iconWrap: 'bg-violet-50 text-violet-600',
      noteClass: 'text-violet-600',
      trendIcon: TrendingUp,
      trendClass: 'text-violet-500',
    },

    {
      title: 'Active Investment Money',
      value: formatCurrency(activeInvestmentMoney),
      note: `${activeInvestmentCount} currently active investments`,
      icon: TrendingUp,
      iconWrap: 'bg-emerald-50 text-emerald-600',
      noteClass: 'text-emerald-600',
      trendIcon: TrendingUp,
      trendClass: 'text-emerald-500',
    },

    {
      title: 'Completed Investment Money',
      value: formatCurrency(completedInvestmentMoney),
      note: `${completedInvestmentCount} completed investments`,
      icon: CheckCircle2,
      iconWrap: 'bg-violet-50 text-violet-600',
      noteClass: 'text-violet-600',
      trendIcon: CheckCircle2,
      trendClass: 'text-violet-500',
    },

    {
      title: 'Unlocked Investment Money',
      value: formatCurrency(unlockedInvestmentMoney),
      note: `${unlockedInvestmentCount} unlocked investments`,
      icon: Layers3,
      iconWrap: 'bg-blue-50 text-blue-600',
      noteClass: 'text-blue-600',
      trendIcon: Layers3,
      trendClass: 'text-blue-500',
    },

    {
      title: 'Today Earnings',
      value: formatCurrency(todayPnL),
      note: isTodayProfit ? 'Today positive' : 'Today negative',
      icon: BadgeIndianRupee,
      iconWrap: isTodayProfit
        ? 'bg-emerald-50 text-emerald-600'
        : 'bg-red-50 text-red-600',
      noteClass: isTodayProfit
        ? 'text-emerald-600'
        : 'text-red-600',
      trendIcon: isTodayProfit ? TrendingUp : TrendingDown,
      trendClass: isTodayProfit
        ? 'text-emerald-500'
        : 'text-red-500',
    },

    {
      title: 'Total Withdrawals',
      value: formatCurrency(totalWithdrawals),
      note: 'Withdrawal debits from user wallet',
      icon: TrendingDown,
      iconWrap: 'bg-rose-50 text-rose-600',
      noteClass: 'text-rose-600',
      trendIcon: TrendingDown,
      trendClass: 'text-rose-500',
    },

    {
      title: 'Total Investments',
      value: String(statusBuckets.all || 0),
      note: `${activeInvestmentCount} active · ${formatCurrency(
        activeInvestmentMoney
      )}`,
      icon: Target,
      iconWrap: 'bg-blue-50 text-blue-600',
      noteClass: 'text-blue-600',
      trendIcon: Layers3,
      trendClass: 'text-blue-500',
    },

    {
      title: 'Completed Investments',
      value: String(completedInvestmentCount),
      note: `${formatCurrency(
        completedInvestmentMoney
      )} completed investment amount`,
      icon: CheckCircle2,
      iconWrap: 'bg-violet-50 text-violet-600',
      noteClass: 'text-violet-600',
      trendIcon: CheckCircle2,
      trendClass: 'text-violet-500',
    },

    {
      title: 'Total Transactions',
      value: String(totalTransactions),
      note: `${formatCurrency(totalCredits)} credits · ${formatCurrency(
        totalDebits
      )} debits`,
      icon: CreditCard,
      iconWrap: 'bg-red-50 text-red-600',
      noteClass: 'text-red-600',
      trendIcon: TrendingUp,
      trendClass: 'text-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          title="Total Deposited Balance"
          value={formatCurrency(totalDeposits)}
          note="Total deposits only, no interest included"
          icon={PiggyBank}
          tone="emerald"
        />

        <OverviewCard
          title="Current Wallet Balance"
          value={formatCurrency(walletBalance)}
          note="Current available balance"
          icon={walletBalance >= 0 ? Wallet : TrendingDown}
          tone="blue"
        />

        <OverviewCard
          title="Total Principal in System"
          value={formatCurrency(principalInSystem)}
          note="Wallet balance + total invested amount"
          icon={Scale}
          tone="blue"
        />

        <OverviewCard
          title="Total Invested"
          value={formatCurrency(totalInvested)}
          note={`${statusBuckets.all || 0} total investments`}
          icon={Target}
          tone="blue"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {detailCards.map((card) => (
          <DetailCard key={card.title} {...card} />
        ))}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="mb-4 flex items-start justify-between">
            <div
              className={`rounded-2xl p-3 ${
                isProfit
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              <DollarSign size={22} />
            </div>

            {isProfit ? (
              <TrendingUp className="text-emerald-500" size={18} />
            ) : (
              <TrendingDown className="text-red-500" size={18} />
            )}
          </div>

          <p className="text-sm text-slate-500">Total Returns</p>

          <p
            className={`mt-2 text-2xl font-bold ${
              isProfit ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {isProfit ? '+' : ''}
            {formatCurrency(totalPnL)}
          </p>

          <div className="mt-2 flex items-center justify-between gap-2">
            <p
              className={`text-xs font-medium ${
                isProfit ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {isProfit ? '+' : ''}
              {totalPnLPercent.toFixed(2)}%
            </p>

            <p
              className={`text-xs font-medium ${
                isTodayProfit ? 'text-blue-600' : 'text-red-600'
              }`}
            >
              Today {isTodayProfit ? '+' : ''}
              {formatCurrency(todayPnL)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserBalanceCards;