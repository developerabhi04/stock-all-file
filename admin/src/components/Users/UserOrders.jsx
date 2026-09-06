import { useMemo, useState } from 'react';
import {
  Layers3,
  Clock,
  CheckCircle,
  XCircle,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  BadgeIndianRupee,
  Lock,
  Unlock,
} from 'lucide-react';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const formatDateTime = (value) => {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '-';
  }
};

const getStatusBadgeClass = (status) => {
  const normalized = String(status || '').toLowerCase();

  if (
    ['completed', 'active', 'approved', 'success', 'unlocked', 'closed', 'closed_reinvested'].includes(
      normalized
    )
  ) {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (['pending', 'processing', 'initiated'].includes(normalized)) {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-red-100 text-red-700';
};

const normalizeSingleOrder = (order = {}, index = 0) => {
  const amount =
    order.totalAmount ??
    order.amount ??
    order.investedAmount ??
    order.investmentAmount ??
    order.principal ??
    0;

  const quantity = order.quantity ?? order.units ?? order.lots ?? 1;
  const totalInterestEarned = Number(order.totalInterestEarned || 0);
  const dailyInterestAmount = Number(order.dailyInterestAmount || order.dailyReturn || 0);
  const effectiveDailyRate = Number(order.effectiveDailyRate || order.dailyRate || order.returnRate || 0);

  const indexName =
    order.indexName ||
    order.index?.name ||
    order.indexId?.name ||
    order.planName ||
    order.productName ||
    order.title ||
    '-';

  const orderId =
    order.orderId ||
    order.transactionId ||
    order.referenceId ||
    order._id ||
    `order-${index}`;

  const orderDate =
    order.orderDate ||
    order.createdAt ||
    order.investedAt ||
    order.purchaseDate ||
    null;

  return {
    ...order,
    _normalizedId: orderId,
    _normalizedIndexName: indexName,
    _normalizedQuantity: Number(quantity || 0),
    _normalizedTotal: Number(amount || 0),
    _normalizedDate: orderDate,
    _normalizedEarned: totalInterestEarned,
    _normalizedDaily: dailyInterestAmount,
    _normalizedRate: effectiveDailyRate,
    _normalizedDaysCompleted: Number(order.daysCompleted || 0),
    _normalizedDaysRemaining: Number(order.daysRemaining || 0),
    _normalizedLockPeriodDays: Number(order.lockPeriodDays || 0),
    _normalizedLockCompleted: Boolean(order.isLockCompleted),
  };
};

const UserOrders = ({ orders = {} }) => {
  const [activeTab, setActiveTab] = useState('all');

  const normalizedOrders = useMemo(() => {
    const all = Array.isArray(orders.all) ? orders.all.map(normalizeSingleOrder) : [];
    const pending = Array.isArray(orders.pending) ? orders.pending.map(normalizeSingleOrder) : [];
    const active = Array.isArray(orders.active) ? orders.active.map(normalizeSingleOrder) : [];
    const unlocked = Array.isArray(orders.unlocked) ? orders.unlocked.map(normalizeSingleOrder) : [];
    const completed = Array.isArray(orders.completed) ? orders.completed.map(normalizeSingleOrder) : [];
    const cancelled = Array.isArray(orders.cancelled) ? orders.cancelled.map(normalizeSingleOrder) : [];

    return { all, pending, active, unlocked, completed, cancelled };
  }, [orders]);

  const tabs = [
    { id: 'all', label: 'All', count: normalizedOrders.all.length, icon: Layers3 },
    { id: 'active', label: 'Active', count: normalizedOrders.active.length, icon: TrendingUp },
    { id: 'pending', label: 'Pending', count: normalizedOrders.pending.length, icon: Clock },
    { id: 'unlocked', label: 'Unlocked', count: normalizedOrders.unlocked.length, icon: Unlock },
    { id: 'completed', label: 'Completed', count: normalizedOrders.completed.length, icon: CheckCircle },
    { id: 'cancelled', label: 'Cancelled', count: normalizedOrders.cancelled.length, icon: XCircle },
  ];

  const currentList = normalizedOrders[activeTab] || [];

  if (!currentList.length && !normalizedOrders.all.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="py-14 text-center">
          <Layers3 className="mx-auto mb-4 text-slate-300" size={46} />
          <p className="font-medium text-slate-600">No investments found</p>
          <p className="mt-1 text-sm text-slate-400">
            User investments and order history will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Layers3 className="text-blue-600" size={24} />
            Investments & Orders
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Full admin view of user investment activity
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                  }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {currentList.length ? (
        <div className="grid grid-cols-1 gap-4">
          {currentList.map((order, index) => {
            const positiveEarned = Number(order._normalizedEarned || 0) >= 0;

            return (
              <div
                key={order._normalizedId || index}
                className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-xl font-bold text-slate-900">
                        {order._normalizedIndexName}
                      </h4>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusBadgeClass(
                          order.status
                        )}`}
                      >
                        {String(order.status || '-').replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span>ID: {order._normalizedId}</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={14} />
                        {formatDateTime(order._normalizedDate)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs text-slate-500">Invested Amount</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {formatCurrency(order._normalizedTotal)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Quantity</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {Number(order._normalizedQuantity || 0).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Daily</p>
                    <p className="mt-1 text-lg font-bold text-emerald-600">
                      {formatCurrency(order._normalizedDaily)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Earned</p>
                    <p className={`mt-1 text-lg font-bold ${positiveEarned ? 'text-emerald-600' : 'text-red-600'}`}>
                      {positiveEarned ? '+' : ''}
                      {formatCurrency(order._normalizedEarned)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Rate</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {Number(order._normalizedRate || 0)}%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Lock Status</p>
                    <div className="mt-1 flex items-center gap-2">
                      {order._normalizedLockCompleted ? (
                        <>
                          <ShieldCheck size={18} className="text-emerald-500" />
                          <span className="font-bold text-emerald-600">Completed</span>
                        </>
                      ) : (
                        <>
                          <Lock size={18} className="text-amber-500" />
                          <span className="font-bold text-amber-600">Locked</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-500">Duration Progress</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {order._normalizedDaysCompleted}/{order._normalizedLockPeriodDays || 0} days completed
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {order._normalizedDaysRemaining} days remaining
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-500">Admin Note</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {order.reason || 'No rejection or admin note available for this investment.'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    <BadgeIndianRupee size={13} />
                    Amount {formatCurrency(order._normalizedTotal)}
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {String(order.type || 'invest').toUpperCase()}
                  </span>

                  {order._normalizedLockCompleted ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <Unlock size={13} />
                      Unlock eligible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      <Lock size={13} />
                      In lock period
                    </span>
                  )}

                  {positiveEarned ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <TrendingUp size={13} />
                      Positive return
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      <TrendingDown size={13} />
                      Negative return
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-14 text-center">
          <Layers3 className="mx-auto mb-4 text-slate-300" size={46} />
          <p className="font-medium text-slate-600">No items in this tab</p>
          <p className="mt-1 text-sm text-slate-400">
            Matching investments will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserOrders;