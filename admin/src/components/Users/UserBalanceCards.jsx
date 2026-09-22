import {
  ArrowDownCircle,
  ArrowUpCircle,
  BadgeIndianRupee,
  CheckCircle2,
  CreditCard,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const StatCard = ({
  title,
  value,
  note,
  icon: Icon,
  iconClassName,
  valueClassName,
  trendIcon: TrendIcon,
  trendClassName,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          <Icon size={22} />
        </div>

        {TrendIcon ? (
          <TrendIcon className={trendClassName || "text-slate-400"} size={18} />
        ) : null}
      </div>

      <p className="text-sm font-medium text-slate-500">{title}</p>

      <p className={`mt-2 text-2xl font-bold ${valueClassName}`}>{value}</p>

      <p className="mt-2 text-xs font-medium text-slate-500">{note}</p>
    </div>
  );
};

const UserBalanceCards = ({ user = {}, portfolio = {}, stats = {} }) => {
  const walletBalance = Number(stats.walletBalance ?? user.walletBalance ?? 0);

  // Comes from buildAdminStats in UserDetails.jsx.
  const totalAddedMoney = Number(
    stats.totalAddedMoney ?? stats.totalDeposits ?? 0,
  );

  const addedMoneyCount = Number(stats.addedMoneyCount ?? 0);

  const totalWithdrawals = Number(stats.totalWithdrawals ?? 0);

  const withdrawalCount = Number(stats.withdrawalCount ?? 0);

  const totalTransactions = Number(stats.totalTransactions ?? 0);

  // Comes from buildPortfolioSummary in UserDetails.jsx.
  const activeInvestmentMoney = Number(portfolio.activeInvested ?? 0);

  const activeInvestmentCount = Number(portfolio.activeInvestmentsCount ?? 0);

  const completedInvestmentMoney = Number(portfolio.completedInvested ?? 0);

  const completedInvestmentCount = Number(
    portfolio.completedInvestmentsCount ?? 0,
  );

  // Must be calculated from active investments only in UserDetails.jsx.
  const todayEarnings = Number(portfolio.todayPnL ?? 0);

  // Active + completed investment return, based on your chosen logic.
  const totalReturns = Number(portfolio.totalPnL ?? 0);

  const isTodayPositive = todayEarnings >= 0;
  const isReturnPositive = totalReturns >= 0;

  return (
    <div className="space-y-5">
      {/* Wallet and transaction information */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Current Wallet Balance"
          value={formatCurrency(walletBalance)}
          note="Current available balance"
          icon={Wallet}
          iconClassName="bg-blue-50 text-blue-600"
          valueClassName="text-blue-700"
          trendIcon={walletBalance >= 0 ? TrendingUp : TrendingDown}
          trendClassName={walletBalance >= 0 ? "text-blue-500" : "text-red-500"}
        />

        <StatCard
          title="Total Added Money"
          value={formatCurrency(totalAddedMoney)}
          note={`${addedMoneyCount.toLocaleString(
            "en-IN",
          )} completed add-money transactions`}
          icon={ArrowUpCircle}
          iconClassName="bg-emerald-50 text-emerald-600"
          valueClassName="text-emerald-700"
          trendIcon={TrendingUp}
          trendClassName="text-emerald-500"
        />

        <StatCard
          title="Total Withdrawals"
          value={formatCurrency(totalWithdrawals)}
          note={`${withdrawalCount.toLocaleString(
            "en-IN",
          )} completed withdrawal transactions`}
          icon={ArrowDownCircle}
          iconClassName="bg-rose-50 text-rose-600"
          valueClassName="text-rose-700"
          trendIcon={TrendingDown}
          trendClassName="text-rose-500"
        />

        <StatCard
          title="Total Transactions"
          value={totalTransactions.toLocaleString("en-IN")}
          note="All wallet and investment transaction records"
          icon={CreditCard}
          iconClassName="bg-slate-100 text-slate-600"
          valueClassName="text-slate-800"
          trendIcon={TrendingUp}
          trendClassName="text-slate-500"
        />
      </div>

      {/* Investment information */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Investment"
          value={formatCurrency(activeInvestmentMoney)}
          note={`${activeInvestmentCount.toLocaleString(
            "en-IN",
          )} active investments`}
          icon={TrendingUp}
          iconClassName="bg-violet-50 text-violet-600"
          valueClassName="text-violet-700"
          trendIcon={TrendingUp}
          trendClassName="text-violet-500"
        />

        <StatCard
          title="Completed Investment Money"
          value={formatCurrency(completedInvestmentMoney)}
          note={`${completedInvestmentCount.toLocaleString(
            "en-IN",
          )} completed investments`}
          icon={CheckCircle2}
          iconClassName="bg-indigo-50 text-indigo-600"
          valueClassName="text-indigo-700"
          trendIcon={CheckCircle2}
          trendClassName="text-indigo-500"
        />

        <StatCard
          title="Today's Earnings"
          value={formatCurrency(todayEarnings)}
          note="Active investments only"
          icon={BadgeIndianRupee}
          iconClassName={
            isTodayPositive
              ? "bg-amber-50 text-amber-600"
              : "bg-red-50 text-red-600"
          }
          valueClassName={isTodayPositive ? "text-amber-700" : "text-red-700"}
          trendIcon={isTodayPositive ? TrendingUp : TrendingDown}
          trendClassName={isTodayPositive ? "text-amber-500" : "text-red-500"}
        />

        <StatCard
          title="Total Returns"
          value={`${isReturnPositive ? "+" : ""}${formatCurrency(
            totalReturns,
          )}`}
          note="Returns from active and completed investments"
          icon={DollarSign}
          iconClassName={
            isReturnPositive
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }
          valueClassName={
            isReturnPositive ? "text-emerald-700" : "text-red-700"
          }
          trendIcon={isReturnPositive ? TrendingUp : TrendingDown}
          trendClassName={
            isReturnPositive ? "text-emerald-500" : "text-red-500"
          }
        />
      </div>
    </div>
  );
};

export default UserBalanceCards;
