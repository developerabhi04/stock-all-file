import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock3,
  Gift,
  RefreshCw,
  Search,
  Users,
  WalletCards,
  X,
  XCircle,
} from 'lucide-react';
import { adminAPI } from '../../services/api';

const formatCurrency = (value) => {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
};

const formatDate = (value) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusClasses = (status) => {
  switch (status) {
    case 'rewarded':
      return 'border-green-200 bg-green-50 text-green-700';

    case 'expired':
      return 'border-red-200 bg-red-50 text-red-700';

    default:
      return 'border-yellow-200 bg-yellow-50 text-yellow-700';
  }
};

const ReferralManagement = () => {
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalRewarded: 0,
    totalPending: 0,
    totalPaidOut: 0,
  });

  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const limit = 20;

  const fetchReferralStats = useCallback(async () => {
    try {
      setStatsLoading(true);

      const response = await adminAPI.getReferralStats();
      const data = response?.data?.data || {};

      setStats({
        totalReferrals: Number(data.totalReferrals || 0),
        totalRewarded: Number(data.totalRewarded || 0),
        totalPending: Number(data.totalPending || 0),
        totalPaidOut: Number(data.totalPaidOut || 0),
      });
    } catch (requestError) {
      console.error(
        '❌ Failed to fetch referral stats:',
        requestError?.response?.data || requestError?.message
      );
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchReferrals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await adminAPI.getAllReferrals({
        page,
        limit,
        status: statusFilter || undefined,
      });

      const data = response?.data?.data || {};

      setReferrals(
        Array.isArray(data.referrals)
          ? data.referrals
          : []
      );

      setTotalPages(
        Math.max(Number(data.totalPages || 1), 1)
      );

      setTotal(Number(data.total || 0));
    } catch (requestError) {
      console.error(
        '❌ Failed to fetch referrals:',
        requestError?.response?.data || requestError?.message
      );

      setError(
        requestError?.response?.data?.message ||
          'Unable to load referral data'
      );

      setReferrals([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchReferralStats();
  }, [fetchReferralStats]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchReferralStats(),
        fetchReferrals(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setAppliedSearch(searchTerm.trim().toLowerCase());
    setPage(1);
  };

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  const filteredReferrals = referrals.filter((referral) => {
    if (!appliedSearch) {
      return true;
    }

    const referrer = referral.referrer || {};
    const referee = referral.referee || {};

    const searchableText = [
      referrer.fullName,
      referrer.phoneNumber,
      referrer.referralCode,
      referee.fullName,
      referee.phoneNumber,
      referral.status,
      referral.referralCodeUsed,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(appliedSearch);
  });

  const renderStatCard = ({
    label,
    value,
    description,
    icon: Icon,
    iconClasses,
    valueClasses,
  }) => {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClasses}`}
          >
            <Icon size={22} />
          </div>

          <Activity
            size={18}
            className="text-gray-300"
          />
        </div>

        <p className="text-sm font-medium text-gray-500">
          {label}
        </p>

        <p
          className={`mt-2 text-2xl font-black ${valueClasses || 'text-gray-900'}`}
        >
          {statsLoading ? '—' : value}
        </p>

        <p className="mt-2 text-xs text-gray-400">
          {description}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-5 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Gift size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">
                  Referral Management
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Track invite-and-earn referrals and rewards
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {renderStatCard({
            label: 'Total Referrals',
            value: stats.totalReferrals,
            description: 'All referral relationships',
            icon: Users,
            iconClasses: 'bg-blue-100 text-blue-600',
            valueClasses: 'text-blue-700',
          })}

          {renderStatCard({
            label: 'Rewarded Referrals',
            value: stats.totalRewarded,
            description: 'Successfully completed',
            icon: CheckCircle2,
            iconClasses: 'bg-green-100 text-green-600',
            valueClasses: 'text-green-700',
          })}

          {renderStatCard({
            label: 'Pending Referrals',
            value: stats.totalPending,
            description: 'Waiting for qualifying recharge',
            icon: Clock3,
            iconClasses: 'bg-yellow-100 text-yellow-600',
            valueClasses: 'text-yellow-700',
          })}

          {renderStatCard({
            label: 'Total Paid Out',
            value: formatCurrency(stats.totalPaidOut),
            description: 'Rewards paid to both users',
            icon: WalletCards,
            iconClasses: 'bg-purple-100 text-purple-600',
            valueClasses: 'text-purple-700',
          })}
        </div>

        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <form
              onSubmit={handleSearch}
              className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl"
            >
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search referrer, referee, phone or code..."
                  className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-purple-700"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-3">
              <label
                htmlFor="referral-status"
                className="text-sm font-semibold text-gray-600"
              >
                Status
              </label>

              <select
                id="referral-status"
                value={statusFilter}
                onChange={handleStatusChange}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="rewarded">Rewarded</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>
              Showing{' '}
              <strong className="text-gray-900">
                {filteredReferrals.length}
              </strong>{' '}
              of{' '}
              <strong className="text-gray-900">
                {total}
              </strong>{' '}
              referrals
            </span>

            {appliedSearch ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setAppliedSearch('');
                }}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-600 hover:bg-gray-200"
              >
                Clear search
                <X size={13} />
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <XCircle className="mt-0.5 shrink-0" size={20} />

            <div>
              <p className="font-bold">
                Unable to load referrals
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <div className="text-center">
                <RefreshCw
                  size={30}
                  className="mx-auto animate-spin text-purple-600"
                />

                <p className="mt-3 text-sm font-semibold text-gray-500">
                  Loading referrals...
                </p>
              </div>
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
              <Gift
                size={44}
                className="text-gray-300"
              />

              <h3 className="mt-4 text-lg font-black text-gray-800">
                No referrals found
              </h3>

              <p className="mt-1 max-w-md text-sm text-gray-500">
                Referral records will appear here when users register with a
                referral code.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-gray-500">
                        Referrer
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-gray-500">
                        Referred User
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-gray-500">
                        Code
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-gray-500">
                        Recharge
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-gray-500">
                        Reward
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-gray-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-gray-500">
                        Created
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredReferrals.map((referral) => {
                      const referrer = referral.referrer || {};
                      const referee = referral.referee || {};

                      return (
                        <tr
                          key={referral._id}
                          className="transition hover:bg-gray-50"
                        >
                          <td className="px-5 py-4">
                            <div className="font-bold text-gray-900">
                              {referrer.fullName || '-'}
                            </div>

                            <div className="mt-1 text-xs text-gray-500">
                              {referrer.phoneNumber || '-'}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-bold text-gray-900">
                              {referee.fullName || '-'}
                            </div>

                            <div className="mt-1 text-xs text-gray-500">
                              {referee.phoneNumber || '-'}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-black tracking-wider text-purple-700">
                              {referral.referralCodeUsed || referrer.referralCode || '-'}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-gray-700">
                            {referral.triggerRechargeAmount
                              ? formatCurrency(referral.triggerRechargeAmount)
                              : '-'}
                          </td>

                          <td className="px-5 py-4 text-sm font-black text-green-600">
                            {referral.status === 'rewarded'
                              ? formatCurrency(referral.rewardAmount)
                              : '-'}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black capitalize ${getStatusClasses(
                                referral.status
                              )}`}
                            >
                              {referral.status || 'pending'}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-500">
                            {formatDate(referral.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-gray-100 lg:hidden">
                {filteredReferrals.map((referral) => {
                  const referrer = referral.referrer || {};
                  const referee = referral.referee || {};

                  return (
                    <div
                      key={referral._id}
                      className="p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-black text-gray-900">
                            {referrer.fullName || '-'}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            invited {referee.fullName || '-'}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black capitalize ${getStatusClasses(
                            referral.status
                          )}`}
                        >
                          {referral.status || 'pending'}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">
                            Referrer phone
                          </p>

                          <p className="mt-1 font-bold text-gray-800">
                            {referrer.phoneNumber || '-'}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">
                            Referee phone
                          </p>

                          <p className="mt-1 font-bold text-gray-800">
                            {referee.phoneNumber || '-'}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">
                            Referral code
                          </p>

                          <p className="mt-1 break-all font-black text-purple-700">
                            {referral.referralCodeUsed ||
                              referrer.referralCode ||
                              '-'}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">
                            Recharge
                          </p>

                          <p className="mt-1 font-bold text-gray-800">
                            {referral.triggerRechargeAmount
                              ? formatCurrency(
                                  referral.triggerRechargeAmount
                                )
                              : '-'}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">
                            Reward
                          </p>

                          <p className="mt-1 font-black text-green-600">
                            {referral.status === 'rewarded'
                              ? formatCurrency(referral.rewardAmount)
                              : '-'}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">
                            Created
                          </p>

                          <p className="mt-1 font-bold text-gray-800">
                            {formatDate(referral.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-sm text-gray-600">
                  Page{' '}
                  <strong className="text-gray-900">
                    {page}
                  </strong>{' '}
                  of{' '}
                  <strong className="text-gray-900">
                    {totalPages}
                  </strong>
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferralManagement;