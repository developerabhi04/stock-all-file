import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  RefreshCw,
  IndianRupee,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { getReportsOverview } from '../../services/api.js';

const STATUS_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(value || 0);

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);

const StatCard = ({ title, value, icon: Icon, tone = 'blue', subtitle }) => {
  const toneClasses = {
    blue: 'from-blue-500/15 to-cyan-500/10 text-blue-600',
    green: 'from-emerald-500/15 to-green-500/10 text-emerald-600',
    orange: 'from-amber-500/15 to-orange-500/10 text-amber-600',
    red: 'from-rose-500/15 to-red-500/10 text-rose-600'
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        <div className={`rounded-2xl bg-gradient-to-br p-3 ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const SectionCard = ({ title, children, action }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {action}
    </div>
    {children}
  </div>
);

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState(null);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getReportsOverview();
      setReports(response?.data || null);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || 'Failed to load reports'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const summary = reports?.summary || {};
  const transactionStatus = reports?.transactionStatus || [];
  const userGrowth = reports?.userGrowth || [];
  const revenueTrend = reports?.revenueTrend || [];
  const topStocks = reports?.topStocks || [];
  const topCategories = reports?.topCategories || [];

  const stats = useMemo(
    () => [
      {
        title: 'Total Users',
        value: formatNumber(summary.totalUsers),
        icon: Users,
        tone: 'blue',
        subtitle: `${formatNumber(summary.activeUsers)} active users`
      },
      {
        title: 'Total Transactions',
        value: formatNumber(summary.totalTransactions),
        icon: Activity,
        tone: 'orange',
        subtitle: `${formatNumber(summary.completedTransactions)} completed`
      },
      {
        title: 'Total Deposits',
        value: formatCurrency(summary.totalDeposits),
        icon: ArrowUpRight,
        tone: 'green',
        subtitle: 'Completed deposit volume'
      },
      {
        title: 'Total Withdrawals',
        value: formatCurrency(summary.totalWithdrawals),
        icon: ArrowDownRight,
        tone: 'red',
        subtitle: 'Completed withdrawal volume'
      },
      {
        title: 'Net Revenue',
        value: formatCurrency(summary.netRevenue),
        icon: IndianRupee,
        tone: 'green',
        subtitle: 'Deposits minus withdrawals'
      },
      {
        title: 'Failed Transactions',
        value: formatNumber(summary.failedTransactions),
        icon: TrendingUp,
        tone: 'red',
        subtitle: `${formatNumber(summary.pendingTransactions)} pending transactions`
      }
    ],
    [summary]
  );

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor users, transactions, revenue flow, and market insights from one place.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {stats.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <SectionCard title="User Growth (Last 6 Months)">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Transaction Status">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={transactionStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                >
                  {transactionStatus.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Revenue Trend (Last 6 Months)">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="deposits"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="withdrawals"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <SectionCard title="Top Stocks">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Ticker</th>
                  <th className="pb-3 pr-4 font-medium">Price</th>
                  <th className="pb-3 pr-4 font-medium">Change %</th>
                  <th className="pb-3 font-medium">Category</th>
                </tr>
              </thead>
              <tbody>
                {topStocks.length > 0 ? (
                  topStocks.map((stock) => (
                    <tr key={stock._id} className="border-b border-slate-100 text-sm">
                      <td className="py-3 pr-4 font-medium text-slate-900">{stock.name}</td>
                      <td className="py-3 pr-4 text-slate-600">{stock.ticker}</td>
                      <td className="py-3 pr-4 text-slate-600">{formatCurrency(stock.price)}</td>
                      <td
                        className={`py-3 pr-4 font-medium ${stock.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                      >
                        {stock.changePercent}%
                      </td>
                      <td className="py-3 text-slate-600">{stock.category}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-sm text-slate-500">
                      No stock data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Latest Categories">
          <div className="space-y-3">
            {topCategories.length > 0 ? (
              topCategories.map((category) => (
                <div
                  key={category._id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{category.name}</p>
                    <p className="text-xs text-slate-500">
                      {category.slug || 'no-slug'} • {category.type || 'General'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${category.isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                      }`}
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                No category data available
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}