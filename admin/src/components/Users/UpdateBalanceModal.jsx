import { useMemo, useState } from 'react';
import { Wallet, Plus, Minus, X, Loader, AlertTriangle } from 'lucide-react';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const UpdateBalanceModal = ({
    userId,
    onClose,
    dispatch,
    updateUserBalance,
    fetchUserDetails,
    currentBalance = 0,
    userName = '',
}) => {
    const [balanceAction, setBalanceAction] = useState('add');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const numericAmount = Number(amount || 0);

    const validationError = useMemo(() => {
        if (!amount) return 'Amount is required';
        if (Number.isNaN(numericAmount) || numericAmount <= 0) return 'Enter a valid amount greater than 0';
        if (!reason.trim()) return 'Reason is required';
        if (reason.trim().length < 3) return 'Reason must be at least 3 characters';
        if (balanceAction === 'deduct' && numericAmount > Number(currentBalance || 0)) {
            return 'Deduction amount exceeds current wallet balance';
        }
        return '';
    }, [amount, numericAmount, reason, balanceAction, currentBalance]);

    const handleBalanceUpdate = async (e) => {
        if (e) e.preventDefault();

        if (validationError) {
            alert(validationError);
            return;
        }

        setLoading(true);

        try {
            await dispatch(
                updateUserBalance({
                    userId,
                    amount: numericAmount,
                    type: balanceAction,
                    reason: reason.trim(),
                })
            ).unwrap();

            onClose();
            dispatch(fetchUserDetails(userId));
        } catch (error) {
            alert(typeof error === 'string' ? error : error?.message || 'Failed to update balance');
        } finally {
            setLoading(false);
        }
    };

    const projectedBalance =
        balanceAction === 'add'
            ? Number(currentBalance || 0) + numericAmount
            : Number(currentBalance || 0) - numericAmount;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 p-6">
                    <div>
                        <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                            <Wallet className="text-blue-600" size={22} />
                            Update Balance
                        </h3>
                        {userName ? (
                            <p className="mt-1 text-sm text-slate-500">{userName}</p>
                        ) : null}
                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-400 transition hover:text-slate-600"
                        type="button"
                    >
                        <X size={22} />
                    </button>
                </div>

                <form onSubmit={handleBalanceUpdate} className="space-y-5 p-6">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Current Wallet Balance</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            {formatCurrency(currentBalance)}
                        </p>
                    </div>

                    <div>
                        <label className="mb-3 block text-sm font-medium text-slate-700">Action Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setBalanceAction('add')}
                                className={`flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 transition ${balanceAction === 'add'
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-200 text-slate-600 hover:border-emerald-300'
                                    }`}
                            >
                                <Plus size={18} />
                                <span className="font-semibold">Add Money</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setBalanceAction('deduct')}
                                className={`flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 transition ${balanceAction === 'deduct'
                                    ? 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-slate-200 text-slate-600 hover:border-red-300'
                                    }`}
                            >
                                <Minus size={18} />
                                <span className="font-semibold">Deduct Money</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Amount (₹)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Reason</label>
                        <textarea
                            rows="3"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter reason for adjustment"
                            className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </div>

                    {amount && !validationError ? (
                        <div
                            className={`rounded-2xl border p-4 ${balanceAction === 'add'
                                ? 'border-emerald-200 bg-emerald-50'
                                : 'border-red-200 bg-red-50'
                                }`}
                        >
                            <p className="text-sm font-medium text-slate-700">Balance Preview</p>
                            <div className="mt-2 flex items-center justify-between text-sm">
                                <span className="text-slate-500">Current</span>
                                <span className="font-semibold text-slate-900">
                                    {formatCurrency(currentBalance)}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-sm">
                                <span className="text-slate-500">
                                    {balanceAction === 'add' ? 'Adding' : 'Deducting'}
                                </span>
                                <span
                                    className={`font-semibold ${balanceAction === 'add' ? 'text-emerald-600' : 'text-red-600'
                                        }`}
                                >
                                    {balanceAction === 'add' ? '+' : '-'}
                                    {formatCurrency(numericAmount)}
                                </span>
                            </div>
                            <div className="mt-2 border-t border-slate-200 pt-2 flex items-center justify-between">
                                <span className="font-medium text-slate-700">New Balance</span>
                                <span className="text-lg font-bold text-slate-900">
                                    {formatCurrency(projectedBalance)}
                                </span>
                            </div>
                        </div>
                    ) : null}

                    {validationError ? (
                        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                            <AlertTriangle className="mt-0.5 text-amber-600" size={18} />
                            <p className="text-sm font-medium text-amber-800">{validationError}</p>
                        </div>
                    ) : null}

                    <div className="flex gap-3 rounded-b-3xl bg-slate-50 pt-2">
                        <button
                            onClick={onClose}
                            type="button"
                            className="flex-1 rounded-2xl bg-slate-200 py-3 font-semibold text-slate-800 transition hover:bg-slate-300"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading || !!validationError}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${balanceAction === 'add'
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-red-600 hover:bg-red-700'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader className="animate-spin" size={18} />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    {balanceAction === 'add' ? <Plus size={18} /> : <Minus size={18} />}
                                    {balanceAction === 'add' ? 'Add Amount' : 'Deduct Amount'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateBalanceModal;