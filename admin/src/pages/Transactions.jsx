import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  ListFilter,
  Phone,
  RefreshCw,
  Search,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Loading from "../components/Loader";
import {
  fetchTransactions,
  setFilters,
  setLimit,
  setPage,
} from "../store/slices/transactionsSlice";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const STATUS_STYLES = {
  completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  rejected: "bg-red-50 text-red-700 ring-1 ring-red-200",
  failed: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
  cancelled: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
};

const STATUS_ICONS = {
  completed: CheckCircle2,
  pending: Clock3,
  rejected: XCircle,
  failed: AlertCircle,
  cancelled: XCircle,
};

// Values must exactly match your Transaction schema's category enum.
const CATEGORY_LABELS = {
  add_money: "Add Money",
  withdrawal: "Withdrawal",
  refund: "Refund",
  investment_principal_debit: "Investment Principal Debit",
  investment_interest: "Investment Interest",
  investment_principal_return: "Investment Principal Return",
  investment_refund: "Investment Refund",
  investment_unlock: "Investment Unlock",
  investment_renew: "Investment Renew",
  referral_bonus: "Referral Bonus",
};

const SkeletonRows = ({ rows = 8 }) => (
  <>
    {Array.from({ length: rows }).map((_, index) => (
      <tr key={`transaction-skeleton-${index}`} className="animate-pulse">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200" />
            <div className="space-y-2">
              <div className="h-3 w-28 rounded bg-gray-200" />
              <div className="h-2.5 w-20 rounded bg-gray-100" />
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="h-3 w-28 rounded bg-gray-200" />
        </td>
        <td className="px-6 py-4">
          <div className="h-3 w-20 rounded bg-gray-200" />
        </td>
        <td className="px-6 py-4">
          <div className="h-3 w-24 rounded bg-gray-100" />
        </td>
        <td className="px-6 py-4">
          <div className="h-5 w-20 rounded-full bg-gray-200" />
        </td>
        <td className="px-6 py-4">
          <div className="h-3 w-32 rounded bg-gray-200" />
        </td>
      </tr>
    ))}
  </>
);

const Transactions = () => {
  const dispatch = useDispatch();
  const {
    transactions = [],
    loading,
    isFetching,
    filters = {},
    currentPage = 1,
    totalPages = 0,
    totalTransactions = 0,
    limit = 40,
    error,
  } = useSelector((state) => state.transactions);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [jumpToPage, setJumpToPage] = useState("");

  const requestTransactions = () => {
    dispatch(
      fetchTransactions({
        page: currentPage,
        limit,
        status: filters.status || "",
        category: filters.category || "",
        startDate: filters.startDate || "",
        endDate: filters.endDate || "",
      }),
    );
  };

  useEffect(() => {
    requestTransactions();
    // The values below are intentionally the request dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dispatch,
    currentPage,
    limit,
    filters.status,
    filters.category,
    filters.startDate,
    filters.endDate,
  ]);

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  const clearAllFilters = () => {
    dispatch(
      setFilters({
        status: "",
        category: "",
        startDate: "",
        endDate: "",
      }),
    );
    setSearchTerm("");
  };

  const goToPage = (page) => {
    const safePage = Number.parseInt(page, 10);

    if (
      !Number.isInteger(safePage) ||
      safePage < 1 ||
      safePage > totalPages ||
      safePage === currentPage ||
      isFetching
    ) {
      return;
    }

    dispatch(setPage(safePage));
  };

  const handleLimitChange = (event) => {
    dispatch(setLimit(Number(event.target.value)));
  };

  const submitJumpToPage = () => {
    const page = Number.parseInt(jumpToPage, 10);
    goToPage(page);
    setJumpToPage("");
  };

  // This is intentionally only a current-page search. For global database search
  // at scale, add a `search` parameter in the backend later.
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;

    const term = searchTerm.trim().toLowerCase();

    return transactions.filter((txn) => {
      const name = txn.userId?.fullName?.toLowerCase() || "";
      const phone = txn.userId?.phoneNumber?.toLowerCase() || "";
      const paymentUtr = txn.paymentDetails?.utrNumber?.toLowerCase() || "";
      const withdrawalUtr =
        txn.withdrawalDetails?.utrNumber?.toLowerCase() || "";
      const category = txn.category?.toLowerCase() || "";
      const categoryLabel = CATEGORY_LABELS[txn.category]?.toLowerCase() || "";
      const status = txn.status?.toLowerCase() || "";
      const amount = String(txn.amount || "");

      return (
        name.includes(term) ||
        phone.includes(term) ||
        paymentUtr.includes(term) ||
        withdrawalUtr.includes(term) ||
        category.includes(term) ||
        categoryLabel.includes(term) ||
        status.includes(term) ||
        amount.includes(term)
      );
    });
  }, [transactions, searchTerm]);

  const summary = useMemo(() => {
    const completedTransactions = filteredTransactions.filter(
      (transaction) =>
        String(transaction.status || "")
          .trim()
          .toLowerCase() === "completed",
    );

    const credit = completedTransactions
      .filter(
        (transaction) =>
          String(transaction.type || "")
            .trim()
            .toLowerCase() === "credit" &&
          String(transaction.category || "")
            .trim()
            .toLowerCase() === "add_money",
      )
      .reduce(
        (sum, transaction) => sum + Math.abs(Number(transaction.amount || 0)),
        0,
      );

    const debit = completedTransactions
      .filter(
        (transaction) =>
          String(transaction.type || "")
            .trim()
            .toLowerCase() === "debit" &&
          String(transaction.category || "")
            .trim()
            .toLowerCase() === "withdrawal",
      )
      .reduce(
        (sum, transaction) => sum + Math.abs(Number(transaction.amount || 0)),
        0,
      );

    const pending = filteredTransactions.filter(
      (transaction) =>
        String(transaction.status || "")
          .trim()
          .toLowerCase() === "pending",
    ).length;

    return {
      credit,
      debit,
      pending,
    };
  }, [filteredTransactions]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 0) return [];

    const maxVisible = 7;
    const pages = [];
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  const activeFilterCount =
    (filters.status ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0);

  const displayStart =
    totalTransactions === 0 ? 0 : (currentPage - 1) * limit + 1;
  const displayEnd = Math.min(currentPage * limit, totalTransactions);

  if (loading && transactions.length === 0) {
    return <Loading message="Loading all transactions..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            All Transactions
          </h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            {searchTerm.trim()
              ? `${filteredTransactions.length.toLocaleString("en-IN")} matching records`
              : `${totalTransactions.toLocaleString("en-IN")} total records`}
          </p>
        </div>

        <button
          onClick={requestTransactions}
          disabled={isFetching}
          className="flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
        >
          <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100">
            <ArrowUpCircle className="text-emerald-600" size={22} />
          </div>
          <p className="text-sm text-gray-600">
            Deposits {searchTerm.trim() ? "(search results)" : "(this page)"}
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {formatCurrency(summary.credit)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-red-100">
            <ArrowDownCircle className="text-red-600" size={22} />
          </div>
          <p className="text-sm text-gray-600">
            Withdrawals {searchTerm.trim() ? "(search results)" : "(this page)"}
          </p>
          <p className="mt-1 text-2xl font-bold text-red-600">
            {formatCurrency(summary.debit)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100">
            <Clock3 className="text-amber-600" size={22} />
          </div>
          <p className="text-sm text-gray-600">
            Pending {searchTerm.trim() ? "(search results)" : "(this page)"}
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {summary.pending}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search this page by user, phone, UTR, amount, category or status..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            onClick={() => setShowFilters((previous) => !previous)}
            className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition ${
              activeFilterCount > 0
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            type="button"
          >
            <ListFilter size={18} />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-600">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-gray-200 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={filters.status || ""}
                onChange={(event) =>
                  handleFilterChange("status", event.target.value)
                }
                disabled={isFetching}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={filters.category || ""}
                onChange={(event) =>
                  handleFilterChange("category", event.target.value)
                }
                disabled={isFetching}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              >
                <option value="">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                From Date
              </label>
              <div className="relative">
                <Calendar
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="date"
                  value={filters.startDate || ""}
                  max={filters.endDate || undefined}
                  onChange={(event) =>
                    handleFilterChange("startDate", event.target.value)
                  }
                  disabled={isFetching}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                To Date
              </label>
              <div className="relative">
                <Calendar
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="date"
                  value={filters.endDate || ""}
                  min={filters.startDate || undefined}
                  onChange={(event) =>
                    handleFilterChange("endDate", event.target.value)
                  }
                  disabled={isFetching}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Rows per page
              </label>
              <select
                value={limit}
                onChange={handleLimitChange}
                disabled={isFetching}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              >
                <option value={20}>20</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex items-end sm:col-span-1 lg:col-span-3">
                <button
                  onClick={clearAllFilters}
                  disabled={isFetching}
                  className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                >
                  <X size={16} />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!isFetching && filteredTransactions.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <Wallet className="mx-auto mb-4 text-gray-400" size={56} />
          <h3 className="mb-2 text-xl font-bold text-gray-800">
            No Transactions Found
          </h3>
          <p className="text-gray-500">
            {searchTerm || activeFilterCount > 0
              ? "Try adjusting your search or filters"
              : "No transactions have been recorded yet"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    User
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Category
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    UTR Number
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isFetching ? (
                  <SkeletonRows rows={Math.min(limit, 10)} />
                ) : (
                  filteredTransactions.map((txn) => {
                    const StatusIcon = STATUS_ICONS[txn.status] || AlertCircle;
                    const utrNumber =
                      txn.paymentDetails?.utrNumber ||
                      txn.withdrawalDetails?.utrNumber;

                    return (
                      <tr key={txn._id} className="transition hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                              {txn.userId?.fullName?.charAt(0)?.toUpperCase() ||
                                "U"}
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-[200px] truncate font-medium text-gray-900">
                                {txn.userId?.fullName || "Unknown User"}
                              </p>
                              <p className="flex items-center gap-1 text-xs text-gray-500">
                                <Phone size={11} />
                                {txn.userId?.phoneNumber || "-"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-700">
                            {CATEGORY_LABELS[txn.category] ||
                              txn.category?.replace(/_/g, " ") ||
                              "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${txn.type === "credit" ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {txn.type === "credit" ? (
                              <ArrowUpCircle size={14} />
                            ) : (
                              <ArrowDownCircle size={14} />
                            )}
                            {txn.type === "credit" ? "+" : "-"}
                            {formatCurrency(Math.abs(Number(txn.amount || 0)))}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {utrNumber ? (
                            <span
                              title={utrNumber}
                              className="inline-flex max-w-[180px] truncate rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-xs font-semibold text-blue-700 ring-1 ring-blue-100"
                            >
                              {utrNumber}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[txn.status] || STATUS_STYLES.failed}`}
                          >
                            <StatusIcon size={12} />
                            {txn.status || "unknown"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {txn.createdAt
                            ? new Date(txn.createdAt).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 py-5 sm:px-6 lg:flex-row">
            <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <p className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {displayStart}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900">
                  {displayEnd}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {totalTransactions.toLocaleString("en-IN")}
                </span>{" "}
                transactions
              </p>

              {totalPages > 1 && (
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-sm text-gray-500">Jump to page:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpToPage}
                    onChange={(event) => setJumpToPage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") submitJumpToPage();
                    }}
                    onBlur={submitJumpToPage}
                    placeholder={String(currentPage)}
                    disabled={isFetching}
                    className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-center text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                  />
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1 || isFetching}
                  className="group flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                  type="button"
                  aria-label="First page"
                  title="First page"
                >
                  <ChevronsLeft
                    size={18}
                    className="transition-transform group-hover:-translate-x-0.5"
                  />
                </button>

                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1 || isFetching}
                  className="group flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                  type="button"
                  aria-label="Previous page"
                  title="Previous page"
                >
                  <ChevronLeft
                    size={18}
                    className="transition-transform group-hover:-translate-x-0.5"
                  />
                </button>

                {pageNumbers[0] > 1 && (
                  <>
                    <button
                      onClick={() => goToPage(1)}
                      disabled={isFetching}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40"
                      type="button"
                    >
                      1
                    </button>
                    {pageNumbers[0] > 2 && (
                      <span className="px-1 text-gray-400">…</span>
                    )}
                  </>
                )}

                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    disabled={isFetching}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all disabled:cursor-not-allowed ${
                      page === currentPage
                        ? "scale-105 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200"
                        : "border border-gray-200 bg-white text-gray-700 hover:scale-105 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40"
                    }`}
                    type="button"
                    aria-current={page === currentPage ? "page" : undefined}
                  >
                    {page}
                  </button>
                ))}

                {pageNumbers[pageNumbers.length - 1] < totalPages && (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                      <span className="px-1 text-gray-400">…</span>
                    )}
                    <button
                      onClick={() => goToPage(totalPages)}
                      disabled={isFetching}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40"
                      type="button"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages || isFetching}
                  className="group flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                  type="button"
                  aria-label="Next page"
                  title="Next page"
                >
                  <ChevronRight
                    size={18}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </button>

                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages || isFetching}
                  className="group flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                  type="button"
                  aria-label="Last page"
                  title="Last page"
                >
                  <ChevronsRight
                    size={18}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
