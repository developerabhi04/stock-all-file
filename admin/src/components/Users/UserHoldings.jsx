import {
    TrendingUp,
    TrendingDown,
    Target,
    CalendarDays,
    BadgeIndianRupee,
    Activity,
} from 'lucide-react';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const formatNumber = (value) => Number(value || 0).toLocaleString('en-IN');

const formatDate = (value) => {
    if (!value) return '-';

    try {
        return new Date(value).toLocaleDateString('en-IN', {
            dateStyle: 'medium',
        });
    } catch {
        return '-';
    }
};

const getSafePortfolio = (portfolio = {}, holdings = []) => {
    const totalInvested =
        portfolio.totalInvested ??
        portfolio.totalPrincipalInvested ??
        holdings.reduce((sum, item) => sum + Number(item.investedValue || item.amount || 0), 0);

    const currentValue =
        portfolio.currentValue ??
        portfolio.totalCurrentValue ??
        holdings.reduce((sum, item) => sum + Number(item.currentValue || 0), 0);

    const totalPnL =
        portfolio.totalPnL ??
        portfolio.totalInterestEarned ??
        currentValue - totalInvested;

    const totalPnLPercent =
        portfolio.totalPnLPercent ??
        (Number(totalInvested || 0) > 0 ? (Number(totalPnL || 0) / Number(totalInvested || 1)) * 100 : 0);

    return {
        totalInvested: Number(totalInvested || 0),
        currentValue: Number(currentValue || 0),
        totalPnL: Number(totalPnL || 0),
        totalPnLPercent: Number(totalPnLPercent || 0),
    };
};

const normalizeHolding = (holding = {}, index = 0) => {
    const investedValue =
        Number(
            holding.investedValue ??
            holding.amount ??
            holding.principal ??
            0
        ) || 0;

    const currentValue =
        Number(
            holding.currentValue ??
            (investedValue + Number(holding.pnl ?? holding.totalInterestEarned ?? 0))
        ) || 0;

    const pnl =
        Number(
            holding.pnl ??
            holding.totalInterestEarned ??
            (currentValue - investedValue)
        ) || 0;

    const pnlPercent =
        holding.pnlPercent !== undefined && holding.pnlPercent !== null
            ? Number(holding.pnlPercent || 0)
            : investedValue > 0
                ? (pnl / investedValue) * 100
                : 0;

    const quantity =
        Number(
            holding.quantity ??
            holding.units ??
            1
        ) || 0;

    const avgBuyPrice =
        Number(
            holding.avgBuyPrice ??
            holding.price ??
            holding.buyPrice ??
            (quantity > 0 ? investedValue / quantity : investedValue)
        ) || 0;

    const currentPrice =
        Number(
            holding.currentPrice ??
            (quantity > 0 ? currentValue / quantity : currentValue)
        ) || 0;

    return {
        ...holding,
        _normalizedId: holding._id || holding.holdingId || `holding-${index}`,
        _normalizedName:
            holding.indexName ||
            holding.index?.name ||
            holding.indexId?.name ||
            holding.planName ||
            holding.title ||
            '-',
        _normalizedSymbol:
            holding.symbol ||
            holding.index?.symbol ||
            holding.indexId?.symbol ||
            '',
        _normalizedPurchaseDate:
            holding.purchaseDate ||
            holding.orderPlacedAt ||
            holding.createdAt ||
            null,
        _normalizedQuantity: quantity,
        _normalizedAvgBuyPrice: avgBuyPrice,
        _normalizedCurrentPrice: currentPrice,
        _normalizedInvestedValue: investedValue,
        _normalizedCurrentValue: currentValue,
        _normalizedPnl: pnl,
        _normalizedPnlPercent: pnlPercent,
        _normalizedDailyReturn: Number(holding.dailyReturn ?? holding.dailyInterestAmount ?? 0),
        _normalizedDaysRemaining: Number(holding.daysRemaining ?? 0),
        _normalizedLockPeriodDays: Number(holding.lockPeriodDays ?? 0),
    };
};

const UserHoldings = ({ holdings = [], portfolio = {} }) => {
    const safeHoldings = Array.isArray(holdings)
        ? holdings.map((item, index) => normalizeHolding(item, index))
        : [];

    const safePortfolio = getSafePortfolio(portfolio, safeHoldings);
    const totalPnLPositive = safePortfolio.totalPnL >= 0;

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900">Holdings</h3>
                    <p className="mt-1 text-sm text-slate-500">Active investments and performance</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-sm text-slate-500">Total Invested</p>
                        <p className="mt-1 text-xl font-bold text-slate-900">
                            {formatCurrency(safePortfolio.totalInvested)}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-blue-50 px-4 py-3">
                        <p className="text-sm text-slate-500">Current Value</p>
                        <p className="mt-1 text-xl font-bold text-blue-600">
                            {formatCurrency(safePortfolio.currentValue)}
                        </p>
                    </div>

                    <div
                        className={`rounded-2xl px-4 py-3 ${totalPnLPositive ? 'bg-emerald-50' : 'bg-red-50'
                            }`}
                    >
                        <p className="text-sm text-slate-500">Total Return</p>
                        <div className="mt-1 flex items-center gap-2">
                            {totalPnLPositive ? (
                                <TrendingUp className="text-emerald-600" size={18} />
                            ) : (
                                <TrendingDown className="text-red-600" size={18} />
                            )}
                            <p
                                className={`text-xl font-bold ${totalPnLPositive ? 'text-emerald-600' : 'text-red-600'
                                    }`}
                            >
                                {totalPnLPositive ? '+' : ''}
                                {formatCurrency(safePortfolio.totalPnL)}
                            </p>
                        </div>
                        <p
                            className={`mt-1 text-sm font-semibold ${totalPnLPositive ? 'text-emerald-600' : 'text-red-600'
                                }`}
                        >
                            {totalPnLPositive ? '+' : ''}
                            {safePortfolio.totalPnLPercent.toFixed(2)}%
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                {safeHoldings.length > 0 ? (
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                                <th className="px-4 py-3">Index / Plan</th>
                                <th className="px-4 py-3 text-center">Qty</th>
                                <th className="px-4 py-3 text-right">Avg Price</th>
                                <th className="px-4 py-3 text-right">Current Price</th>
                                <th className="px-4 py-3 text-right">Invested</th>
                                <th className="px-4 py-3 text-right">Current Value</th>
                                <th className="px-4 py-3 text-right">P&amp;L</th>
                                <th className="px-4 py-3 text-center">Return %</th>
                            </tr>
                        </thead>

                        <tbody>
                            {safeHoldings.map((holding) => {
                                const pnl = Number(holding._normalizedPnl || 0);
                                const pnlPercent = Number(holding._normalizedPnlPercent || 0);
                                const isProfit = pnl >= 0;

                                return (
                                    <tr
                                        key={holding._normalizedId}
                                        className="border-b border-slate-100 transition hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    {holding._normalizedName}
                                                </p>

                                                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                                    {holding._normalizedSymbol ? (
                                                        <span className="rounded-full bg-slate-100 px-2 py-1 font-medium uppercase tracking-wide">
                                                            {holding._normalizedSymbol}
                                                        </span>
                                                    ) : null}

                                                    <span className="inline-flex items-center gap-1">
                                                        <CalendarDays size={13} />
                                                        {formatDate(holding._normalizedPurchaseDate)}
                                                    </span>

                                                    {holding._normalizedDailyReturn > 0 ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-600">
                                                            <BadgeIndianRupee size={13} />
                                                            Daily {formatCurrency(holding._normalizedDailyReturn)}
                                                        </span>
                                                    ) : null}

                                                    {holding._normalizedLockPeriodDays > 0 ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Activity size={13} />
                                                            {holding._normalizedDaysRemaining} / {holding._normalizedLockPeriodDays} days left
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                                                {formatNumber(holding._normalizedQuantity)}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4 text-right font-medium text-slate-700">
                                            {formatCurrency(holding._normalizedAvgBuyPrice)}
                                        </td>

                                        <td className="px-4 py-4 text-right font-medium text-blue-600">
                                            {formatCurrency(holding._normalizedCurrentPrice)}
                                        </td>

                                        <td className="px-4 py-4 text-right font-semibold text-slate-900">
                                            {formatCurrency(holding._normalizedInvestedValue)}
                                        </td>

                                        <td className="px-4 py-4 text-right font-semibold text-blue-600">
                                            {formatCurrency(holding._normalizedCurrentValue)}
                                        </td>

                                        <td
                                            className={`px-4 py-4 text-right text-base font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'
                                                }`}
                                        >
                                            {isProfit ? '+' : ''}
                                            {formatCurrency(pnl)}
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {isProfit ? (
                                                    <TrendingUp className="text-emerald-600" size={16} />
                                                ) : (
                                                    <TrendingDown className="text-red-600" size={16} />
                                                )}
                                                <span
                                                    className={`font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'
                                                        }`}
                                                >
                                                    {isProfit ? '+' : ''}
                                                    {pnlPercent.toFixed(2)}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="py-14 text-center">
                        <Target className="mx-auto mb-4 text-slate-300" size={46} />
                        <p className="font-medium text-slate-600">No holdings yet</p>
                        <p className="mt-1 text-sm text-slate-400">
                            Active investments will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserHoldings;