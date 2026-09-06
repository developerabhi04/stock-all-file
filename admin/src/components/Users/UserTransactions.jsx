import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Search,
  Wallet,
  Landmark,
  BadgeIndianRupee,
  Layers3,
  TrendingUp,
  CircleDollarSign,
  CalendarDays,
  X,
  Hash,
  RefreshCw,
} from 'lucide-react';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const formatDateTime = (value) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const toTitleCase = (value = '') =>
  String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const CATEGORY_LABELS = {
  add_money: 'Add Money',
  withdrawal: 'Withdrawal',
  trade_buy: 'Trade Buy',
  trade_sell: 'Trade Sell',
  profit: 'Profit',
  loss: 'Loss',
  refund: 'Refund',
  investment_principal_debit: 'Investment Amount Debited',
  investment_interest: 'Investment Interest',
  investment_principal_return: 'Investment Principal Returned',
  investment_refund: 'Investment Refund',
  investment_unlock: 'Investment Unlock',
  investment_renew: 'Investment Renew',
  referral_bonus: 'Referral Bonus',
};

const normalizeTransaction = (txn = {}, index = 0) => {
  const category = String(txn.category || 'other').toLowerCase();
  const type = String(txn.type || 'debit').toLowerCase();
  const status = String(txn.status || 'pending').toLowerCase();

  const reference =
    txn.referenceId ||
    txn.transactionId ||
    txn.orderId ||
    txn.paymentId ||
    txn._id ||
    txn.id ||
    `txn-${index}`;

  const utrNumber =
    txn.paymentDetails?.utrNumber ||
    txn.withdrawalDetails?.utrNumber ||
    txn.utrNumber ||
    '';

  const note =
    txn.description ||
    txn.remark ||
    txn.note ||
    txn.message ||
    txn.reason ||
    txn.adminNote ||
    txn.paymentDetails?.verificationNote ||
    txn.withdrawalDetails?.rejectionReason ||
    '';

  return {
    ...txn,
    _normalizedId: String(reference),
    _normalizedCategory: category,
    _normalizedType: type,
    _normalizedStatus: status,
    _normalizedTitle: CATEGORY_LABELS[category] || toTitleCase(category),
    _normalizedAmount: Number(txn.amount || 0),
    _normalizedDate: txn.createdAt || txn.updatedAt || null,
    _normalizedNote: String(note),
    _normalizedUtrNumber: String(utrNumber),
  };
};

const getStatusClass = (status) => {
  if (['completed', 'success', 'approved'].includes(status)) {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (['pending', 'processing', 'initiated'].includes(status)) {
    return 'bg-amber-100 text-amber-700';
  }

  if (['rejected', 'failed', 'cancelled'].includes(status)) {
    return 'bg-red-100 text-red-700';
  }

  return 'bg-slate-100 text-slate-700';
};

const getTypeIcon = (txn) => {
  const category = txn._normalizedCategory;
  const type = txn._normalizedType;

  if (category === 'add_money') return Wallet;
  if (category === 'withdrawal') return Landmark;

  if (
    [
      'profit',
      'investment_interest',
      'investment_principal_return',
      'investment_unlock',
      'investment_refund',
    ].includes(category)
  ) {
    return TrendingUp;
  }

  if (
    [
      'trade_buy',
      'investment_principal_debit',
      'investment_renew',
    ].includes(category)
  ) {
    return Layers3;
  }

  if (category === 'referral_bonus') return BadgeIndianRupee;

  return type === 'credit' ? ArrowDownLeft : ArrowUpRight;
};

const getTypeClass = (txn) => {
  const category = txn._normalizedCategory;
  const type = txn._normalizedType;

  if (category === 'add_money') return 'bg-cyan-50 text-cyan-600';
  if (category === 'withdrawal') return 'bg-rose-50 text-rose-600';

  if (
    [
      'profit',
      'investment_interest',
      'investment_principal_return',
      'investment_unlock',
      'investment_refund',
    ].includes(category)
  ) {
    return 'bg-emerald-50 text-emerald-600';
  }

  if (
    [
      'trade_buy',
      'investment_principal_debit',
      'investment_renew',
    ].includes(category)
  ) {
    return 'bg-violet-50 text-violet-600';
  }

  if (category === 'referral_bonus') return 'bg-amber-50 text-amber-600';

  return type === 'credit'
    ? 'bg-emerald-50 text-emerald-600'
    : 'bg-red-50 text-red-600';
};

const SkeletonRows = ({ rows = 8 }) => (
  <>
    {Array.from({ length: rows }).map((_, index) => (
      <tr key={`user-transaction-skeleton-${index}`} className="animate-pulse border-b border-slate-100">
        <td className="px-4 py-4"><div className="h-11 w-52 rounded-xl bg-slate-200" /></td>
        <td className="px-4 py-4"><div className="h-6 w-32 rounded-full bg-slate-200" /></td>
        <td className="px-4 py-4"><div className="h-4 w-20 rounded bg-slate-200" /></td>
        <td className="px-4 py-4"><div className="h-6 w-28 rounded bg-slate-100" /></td>
        <td className="px-4 py-4"><div className="h-6 w-20 rounded-full bg-slate-200" /></td>
        <td className="px-4 py-4"><div className="h-4 w-32 rounded bg-slate-200" /></td>
        <td className="px-4 py-4"><div className="h-4 w-48 rounded bg-slate-100" /></td>
      </tr>
    ))}
  </>
);

/*
  This component receives only the server-paginated records for the current page.
  Search is therefore current-page search only.

  Status, category, and date filters are controlled by the parent page and should
  be sent to the backend with userId/page/limit. This component asks the parent to
  update them through `onFiltersChange`.
*/
const UserTransactions = ({
  transactions = [],
  currentPage = 1,
  totalPages = 0,
  totalTransactions = 0,
  limit = 40,
  isFetching = false,
  filters = {},
  onPageChange,
  onFiltersChange,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [jumpToPage, setJumpToPage] = useState('');

  const statusFilter = filters.status || '';
  const categoryFilter = filters.category || '';
  const startDate = filters.startDate || '';
  const endDate = filters.endDate || '';

  const normalizedTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];

    return transactions
      .map((txn, index) => normalizeTransaction(txn, index))
      .sort((first, second) => {
        const firstDate = new Date(first._normalizedDate || 0).getTime();
        const secondDate = new Date(second._normalizedDate || 0).getTime();
        return secondDate - firstDate;
      });
  }, [transactions]);

  // Search is intentionally current-page only. It cannot honestly claim to
  // search all 2 lakh records unless a backend `search` query parameter is added.
  const visibleTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return normalizedTransactions;

    return normalizedTransactions.filter((txn) => {
      const dateText = txn._normalizedDate
        ? new Date(txn._normalizedDate).toLocaleDateString('en-IN').toLowerCase()
        : '';

      return (
        txn._normalizedTitle.toLowerCase().includes(query) ||
        txn._normalizedId.toLowerCase().includes(query) ||
        txn._normalizedCategory.toLowerCase().includes(query) ||
        txn._normalizedStatus.toLowerCase().includes(query) ||
        txn._normalizedNote.toLowerCase().includes(query) ||
        txn._normalizedUtrNumber.toLowerCase().includes(query) ||
        String(txn._normalizedAmount).includes(query) ||
        dateText.includes(query)
      );
    });
  }, [normalizedTransactions, search]);

  const summary = useMemo(() => {
    const credit = normalizedTransactions
      .filter((txn) => txn._normalizedType === 'credit')
      .reduce((sum, txn) => sum + txn._normalizedAmount, 0);

    const debit = normalizedTransactions
      .filter((txn) => txn._normalizedType === 'debit')
      .reduce((sum, txn) => sum + Math.abs(txn._normalizedAmount), 0);

    const pending = normalizedTransactions.filter(
      (txn) => txn._normalizedStatus === 'pending'
    ).length;

    return { credit, debit, pending };
  }, [normalizedTransactions]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 0) return [];

    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const activeFilterCount =
    (statusFilter ? 1 : 0) +
    (categoryFilter ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  const displayStart = totalTransactions === 0 ? 0 : (currentPage - 1) * limit + 1;
  const displayEnd = Math.min(currentPage * limit, totalTransactions);

  const changeFilters = (nextFilters) => {
    if (!onFiltersChange || isFetching) return;
    onFiltersChange(nextFilters);
  };

  const clearAllFilters = () => {
    setSearch('');
    changeFilters({ status: '', category: '', startDate: '', endDate: '' });
  };

  const goToPage = (page) => {
    if (
      !onPageChange ||
      isFetching ||
      page < 1 ||
      page > totalPages ||
      page === currentPage
    ) {
      return;
    }

    onPageChange(page);
  };

  const submitJumpToPage = () => {
    const page = Number.parseInt(jumpToPage, 10);
    goToPage(page);
    setJumpToPage('');
  };

  const hasNoTransactions = !isFetching && totalTransactions === 0;

  if (hasNoTransactions) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="py-14 text-center">
          <CircleDollarSign className="mx-auto mb-4 text-slate-300" size={46} />
          <p className="font-medium text-slate-600">No transactions found</p>
          <p className="mt-1 text-sm text-slate-400">
            This user has no transactions matching the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Transactions</h3>
          <p className="mt-1 text-sm text-slate-500">
            Complete history is available through pagination, 40 records at a time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            {totalTransactions.toLocaleString('en-IN')} total records
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Credits (this page)</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatCurrency(summary.credit)}</p>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Debits (this page)</p>
          <p className="mt-1 text-xl font-bold text-red-700">{formatCurrency(summary.debit)}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending (this page)</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{summary.pending}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative xl:col-span-2">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search only this page by ID, UTR, amount, note..."
            className="min-h-[44px] w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500"
          />
        </div>

        <div className="relative">
          <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(event) => changeFilters({ ...filters, status: event.target.value })}
            disabled={isFetching}
            className="min-h-[44px] w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 disabled:opacity-60"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <select
          value={categoryFilter}
          onChange={(event) => changeFilters({ ...filters, category: event.target.value })}
          disabled={isFetching}
          className="min-h-[44px] w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 disabled:opacity-60"
        >
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CalendarDays size={16} />
            From Date
          </label>
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => changeFilters({ ...filters, startDate: event.target.value })}
            disabled={isFetching}
            className="min-h-[44px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 disabled:opacity-60"
          />
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CalendarDays size={16} />
            To Date
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => changeFilters({ ...filters, endDate: event.target.value })}
            disabled={isFetching}
            className="min-h-[44px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 disabled:opacity-60"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={clearAllFilters}
            disabled={activeFilterCount === 0 && !search.trim()}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      </div>

      {!isFetching && visibleTransactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
          <CircleDollarSign className="mx-auto mb-3 text-slate-300" size={42} />
          <p className="font-semibold text-slate-600">No matching transactions on this page</p>
          <p className="mt-1 text-sm text-slate-400">Clear the search or browse another page.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-[1100px] w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">UTR Number</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <SkeletonRows rows={Math.min(limit, 10)} />
              ) : (
                visibleTransactions.map((txn, index) => {
                  const Icon = getTypeIcon(txn);
                  const iconClass = getTypeClass(txn);
                  const isCredit = txn._normalizedType === 'credit';

                  return (
                    <tr key={txn._normalizedId || index} className="border-b border-slate-100 transition hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className={`rounded-2xl p-2.5 ${iconClass}`}>
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate font-semibold text-slate-900">{txn._normalizedTitle}</p>
                            <p title={txn._normalizedId} className="mt-1 flex max-w-[220px] items-center gap-1 truncate font-mono text-xs text-slate-500">
                              <Hash size={11} />
                              {txn._normalizedId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {txn._normalizedTitle}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-base font-bold ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isCredit ? '+' : '-'}{formatCurrency(Math.abs(txn._normalizedAmount))}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {txn._normalizedUtrNumber ? (
                          <span title={txn._normalizedUtrNumber} className="inline-flex max-w-[180px] truncate rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                            {txn._normalizedUtrNumber}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(txn._normalizedStatus)}`}>
                          {txn._normalizedStatus}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {formatDateTime(txn._normalizedDate)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        <p title={txn._normalizedNote} className="max-w-[300px] break-words">
                          {txn._normalizedNote || '-'}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-5 lg:flex-row">
        <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{displayStart}</span> to{' '}
            <span className="font-semibold text-slate-900">{displayEnd}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalTransactions.toLocaleString('en-IN')}</span> transactions
          </p>

          {totalPages > 1 && (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-slate-500">Jump to:</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpToPage}
                onChange={(event) => setJumpToPage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') submitJumpToPage();
                }}
                onBlur={submitJumpToPage}
                disabled={isFetching}
                placeholder={String(currentPage)}
                className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-center text-sm outline-none transition focus:border-blue-500 disabled:opacity-60"
              />
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              title="First page"
              aria-label="First page"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1 || isFetching}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              type="button"
              title="Previous page"
              aria-label="Previous page"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1 || isFetching}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>

            {pageNumbers[0] > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goToPage(1)}
                  disabled={isFetching}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40"
                >
                  1
                </button>
                {pageNumbers[0] > 2 && <span className="px-1 text-slate-400">…</span>}
              </>
            )}

            {pageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => goToPage(page)}
                disabled={isFetching}
                aria-current={page === currentPage ? 'page' : undefined}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition ${
                  page === currentPage
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40'
                }`}
              >
                {page}
              </button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                  <span className="px-1 text-slate-400">…</span>
                )}
                <button
                  type="button"
                  onClick={() => goToPage(totalPages)}
                  disabled={isFetching}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              title="Next page"
              aria-label="Next page"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages || isFetching}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              title="Last page"
              aria-label="Last page"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages || isFetching}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserTransactions;