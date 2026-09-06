import { useState, useEffect, useCallback } from 'react';
import {
    Wallet,
    Building2,
    Save,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    Copy,
    Check,
    RefreshCw,
    Eye,
    EyeOff,
} from 'lucide-react';
import { adminAPI } from '../../services/api';

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    const styles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
    };
    const icons = {
        success: <CheckCircle size={16} className="text-green-600 flex-shrink-0" />,
        error: <XCircle size={16} className="text-red-600 flex-shrink-0" />,
        info: <AlertCircle size={16} className="text-blue-600 flex-shrink-0" />,
    };

    return (
        <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg ${styles[type]}`}
        >
            {icons[type]}
            <span>{message}</span>
        </div>
    );
};

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const Toggle = ({ enabled, onChange, label, description, disabled = false }) => (
    <div className="flex items-start justify-between gap-4">
        <div>
            <p className="text-sm font-semibold text-gray-800">{label}</p>
            {description && (
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
        </div>
        <button
            type="button"
            onClick={() => !disabled && onChange(!enabled)}
            disabled={disabled}
            aria-label={label}
            className={`relative flex-shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${enabled ? 'bg-blue-600' : 'bg-gray-300'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200
                    ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    </div>
);

// ─── Input Field ──────────────────────────────────────────────────────────────
const Field = ({
    label,
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    type = 'text',
    hint,
    uppercase = false,
    mono = false,
    maxLength,
}) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
            type={type}
            value={value}
            onChange={(e) =>
                onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)
            }
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${disabled
                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                }
                ${uppercase || mono ? 'font-mono tracking-wider' : ''}`}
        />
        {hint && <p className="text-xs text-gray-500 leading-relaxed">{hint}</p>}
    </div>
);

// ─── Status Pill ──────────────────────────────────────────────────────────────
const StatusPill = ({ enabled }) => (
    <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
            ${enabled
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}
    >
        <span
            className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
        />
        {enabled ? 'Live' : 'Off'}
    </span>
);

// ─── Copy Button ──────────────────────────────────────────────────────────────
const CopyBtn = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const handle = () => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={handle}
            title="Copy to clipboard"
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
            {copied
                ? <Check size={13} className="text-green-600" />
                : <Copy size={13} />
            }
        </button>
    );
};

// ─── Preview Row ──────────────────────────────────────────────────────────────
const PreviewRow = ({ label, value, mono = false, copyable = false }) => {
    if (!value) return null;
    return (
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-500 w-36 flex-shrink-0">{label}</span>
            <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
                <span className={`text-xs font-semibold text-gray-800 truncate ${mono ? 'font-mono' : ''}`}>
                    {value}
                </span>
                {copyable && <CopyBtn text={value} />}
            </div>
        </div>
    );
};

// ─── Section Divider ──────────────────────────────────────────────────────────
const Divider = () => <div className="h-px bg-gray-100 my-1" />;

// ─── Main Component ───────────────────────────────────────────────────────────
const PaymentConfigManager = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingUpi, setIsSavingUpi] = useState(false);
    const [isSavingBank, setIsSavingBank] = useState(false);
    const [toast, setToast] = useState(null);
    const [showAccountNumber, setShowAccountNumber] = useState(false);

    const [upi, setUpi] = useState({
        enabled: false,
        upiId: '',
        payeeName: '',
    });

    const [bank, setBank] = useState({
        enabled: false,
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        accountType: 'savings',
    });

    const showToast = (message, type = 'success') =>
        setToast({ message, type });
    const hideToast = () => setToast(null);

    const setUpiField = (field, val) => setUpi((p) => ({ ...p, [field]: val }));
    const setBankField = (field, val) => setBank((p) => ({ ...p, [field]: val }));

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchConfig = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await adminAPI.getPaymentConfig();
            const data = res?.data?.data || res?.data;

            if (data?.upi) {
                setUpi({
                    enabled: data.upi.enabled || false,
                    upiId: data.upi.upiId || '',
                    payeeName: data.upi.payeeName || '',
                });
            }
            if (data?.bank) {
                setBank({
                    enabled: data.bank.enabled || false,
                    accountHolderName: data.bank.accountHolderName || '',
                    accountNumber: data.bank.accountNumber || '',
                    ifscCode: data.bank.ifscCode || '',
                    bankName: data.bank.bankName || '',
                    accountType: data.bank.accountType || 'savings',
                });
            }
        } catch (err) {
            console.error('❌ fetchConfig error:', err);
            showToast('Failed to load payment config. Please refresh.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchConfig(); }, [fetchConfig]);

    // ── Validate UPI ──────────────────────────────────────────────────────────
    const validateUpi = () => {
        if (upi.enabled && !upi.upiId.trim()) {
            showToast('UPI ID is required when UPI is enabled', 'error');
            return false;
        }
        if (upi.upiId.trim() && !upi.upiId.includes('@')) {
            showToast('UPI ID must contain @ (e.g. merchant@paytm)', 'error');
            return false;
        }
        return true;
    };

    // ── Validate Bank ─────────────────────────────────────────────────────────
    const validateBank = () => {
        if (bank.enabled) {
            if (!bank.accountHolderName.trim()) {
                showToast('Account holder name is required when bank is enabled', 'error');
                return false;
            }
            if (!bank.accountNumber.trim()) {
                showToast('Account number is required when bank is enabled', 'error');
                return false;
            }
            if (!bank.ifscCode.trim()) {
                showToast('IFSC code is required when bank is enabled', 'error');
                return false;
            }
        }
        if (bank.ifscCode.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifscCode.trim())) {
            showToast('Invalid IFSC format. Example: SBIN0001234', 'error');
            return false;
        }
        return true;
    };

    // ── Save UPI ──────────────────────────────────────────────────────────────
    const handleSaveUpi = async () => {
        if (!validateUpi()) return;
        setIsSavingUpi(true);
        try {
            await adminAPI.updateUpiConfig({
                upiId: upi.upiId.trim(),
                payeeName: upi.payeeName.trim(),
                enabled: upi.enabled,
            });
            showToast('UPI settings saved successfully ✓', 'success');
        } catch (err) {
            showToast(err?.response?.data?.message || 'Failed to save UPI settings', 'error');
        } finally {
            setIsSavingUpi(false);
        }
    };

    // ── Save Bank ─────────────────────────────────────────────────────────────
    const handleSaveBank = async () => {
        if (!validateBank()) return;
        setIsSavingBank(true);
        try {
            await adminAPI.updateBankConfig({
                accountHolderName: bank.accountHolderName.trim(),
                accountNumber: bank.accountNumber.trim(),
                ifscCode: bank.ifscCode.trim().toUpperCase(),
                bankName: bank.bankName.trim(),
                accountType: bank.accountType,
                enabled: bank.enabled,
            });
            showToast('Bank settings saved successfully ✓', 'success');
        } catch (err) {
            showToast(err?.response?.data?.message || 'Failed to save bank settings', 'error');
        } finally {
            setIsSavingBank(false);
        }
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-28 gap-3">
                <Loader2 size={32} className="text-blue-500 animate-spin" />
                <p className="text-sm text-gray-500 font-medium">Loading payment config...</p>
            </div>
        );
    }

    const maskedAccount = bank.accountNumber
        ? bank.accountNumber.slice(0, -4).replace(/./g, '•') + bank.accountNumber.slice(-4)
        : '';

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Toast */}
            {toast && (
                <div className="fixed top-6 right-6 z-50 w-80">
                    <Toast message={toast.message} type={toast.type} onClose={hideToast} />
                </div>
            )}

            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Payment Configuration</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Manage UPI and bank details shown to users when they add money
                    </p>
                </div>
                <button
                    onClick={fetchConfig}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600
                        hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <RefreshCw size={15} />
                    Refresh
                </button>
            </div>

            {/* ── Status summary strip ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
                {/* UPI summary */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Wallet size={20} className="text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-800">UPI Payment</p>
                            <StatusPill enabled={upi.enabled} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate font-mono">
                            {upi.upiId || 'No UPI ID set'}
                        </p>
                    </div>
                </div>

                {/* Bank summary */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Building2 size={20} className="text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-800">Bank Transfer</p>
                            <StatusPill enabled={bank.enabled} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {bank.bankName
                                ? `${bank.bankName} · ${maskedAccount}`
                                : 'No bank set'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Cards ────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── UPI Card ─────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50/60 to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <Wallet size={18} className="text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">UPI Payment</h3>
                                    <p className="text-xs text-gray-500">PhonePe · GPay · Paytm · BHIM</p>
                                </div>
                            </div>
                            <StatusPill enabled={upi.enabled} />
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 space-y-5 flex-1">
                        <Toggle
                            enabled={upi.enabled}
                            onChange={(val) => setUpiField('enabled', val)}
                            label="Enable UPI Payments"
                            description="Users will see UPI option on the payment screen"
                        />

                        <Divider />

                        <Field
                            label="UPI ID"
                            value={upi.upiId}
                            onChange={(val) => setUpiField('upiId', val)}
                            placeholder="merchant@paytm"
                            required={upi.enabled}
                            disabled={!upi.enabled}
                            hint="Users will send payment to this UPI ID"
                        />

                        <Field
                            label="Payee Name"
                            value={upi.payeeName}
                            onChange={(val) => setUpiField('payeeName', val)}
                            placeholder="TradeHub Payments"
                            disabled={!upi.enabled}
                            hint="Displayed to users before they confirm payment in their UPI app"
                        />

                        {/* Live preview */}
                        {upi.enabled && upi.upiId && (
                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                                <p className="text-xs font-bold text-purple-700 mb-3 uppercase tracking-wide">
                                    Preview — Users will see
                                </p>
                                <div className="bg-white rounded-lg border border-purple-100 px-4 py-3 flex items-center justify-between">
                                    <div>
                                        {upi.payeeName && (
                                            <p className="text-sm font-bold text-gray-900">
                                                {upi.payeeName}
                                            </p>
                                        )}
                                        <p className="text-sm font-mono text-purple-700 font-semibold">
                                            {upi.upiId}
                                        </p>
                                    </div>
                                    <CopyBtn text={upi.upiId} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            {upi.enabled ? 'Visible to users' : 'Hidden from users'}
                        </p>
                        <button
                            onClick={handleSaveUpi}
                            disabled={isSavingUpi}
                            className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700
                                disabled:bg-purple-400 text-white text-sm font-bold rounded-lg
                                transition-colors shadow-sm"
                        >
                            {isSavingUpi
                                ? <><Loader2 size={14} className="animate-spin" />Saving...</>
                                : <><Save size={14} />Save UPI</>
                            }
                        </button>
                    </div>
                </div>

                {/* ── Bank Card ─────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/60 to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <Building2 size={18} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">Bank Transfer</h3>
                                    <p className="text-xs text-gray-500">NEFT · RTGS · IMPS</p>
                                </div>
                            </div>
                            <StatusPill enabled={bank.enabled} />
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 space-y-5 flex-1">
                        <Toggle
                            enabled={bank.enabled}
                            onChange={(val) => setBankField('enabled', val)}
                            label="Enable Bank Transfer"
                            description="Users will see bank account details on the payment screen"
                        />

                        <Divider />

                        <Field
                            label="Account Holder Name"
                            value={bank.accountHolderName}
                            onChange={(val) => setBankField('accountHolderName', val)}
                            placeholder="TradeHub Private Limited"
                            required={bank.enabled}
                            disabled={!bank.enabled}
                        />

                        {/* Account Number with show/hide */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700">
                                Account Number
                                {bank.enabled && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <div className="relative">
                                <input
                                    type={showAccountNumber ? 'text' : 'password'}
                                    value={bank.accountNumber}
                                    onChange={(e) => setBankField('accountNumber', e.target.value)}
                                    placeholder="1234567890"
                                    disabled={!bank.enabled}
                                    className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm font-mono
                                        transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                        ${!bank.enabled
                                            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                            : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                                        }`}
                                />
                                {bank.enabled && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAccountNumber((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2
                                            text-gray-400 hover:text-gray-700 transition-colors"
                                    >
                                        {showAccountNumber
                                            ? <EyeOff size={16} />
                                            : <Eye size={16} />
                                        }
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">
                                Double-check — users will transfer money to this account
                            </p>
                        </div>

                        <Field
                            label="IFSC Code"
                            value={bank.ifscCode}
                            onChange={(val) => setBankField('ifscCode', val)}
                            placeholder="SBIN0001234"
                            required={bank.enabled}
                            disabled={!bank.enabled}
                            uppercase
                            maxLength={11}
                            hint="11-character code found on your cheque book or bank passbook"
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <Field
                                label="Bank Name"
                                value={bank.bankName}
                                onChange={(val) => setBankField('bankName', val)}
                                placeholder="State Bank of India"
                                disabled={!bank.enabled}
                            />

                            {/* Account Type */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Account Type
                                </label>
                                <select
                                    value={bank.accountType}
                                    onChange={(e) => setBankField('accountType', e.target.value)}
                                    disabled={!bank.enabled}
                                    className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-all
                                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                        ${!bank.enabled
                                            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                            : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                                        }`}
                                >
                                    <option value="savings">Savings</option>
                                    <option value="current">Current</option>
                                </select>
                            </div>
                        </div>

                        {/* Live preview */}
                        {bank.enabled && bank.accountNumber && (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <p className="text-xs font-bold text-blue-700 mb-3 uppercase tracking-wide">
                                    Preview — Users will see
                                </p>
                                <div className="bg-white rounded-lg border border-blue-100 overflow-hidden">
                                    <PreviewRow
                                        label="Account Holder"
                                        value={bank.accountHolderName}
                                    />
                                    <PreviewRow
                                        label="Account Number"
                                        value={maskedAccount}
                                        mono
                                        copyable
                                    />
                                    <PreviewRow
                                        label="IFSC Code"
                                        value={bank.ifscCode}
                                        mono
                                        copyable
                                    />
                                    <PreviewRow
                                        label="Bank Name"
                                        value={bank.bankName}
                                    />
                                    <PreviewRow
                                        label="Account Type"
                                        value={
                                            bank.accountType.charAt(0).toUpperCase() +
                                            bank.accountType.slice(1)
                                        }
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            {bank.enabled ? 'Visible to users' : 'Hidden from users'}
                        </p>
                        <button
                            onClick={handleSaveBank}
                            disabled={isSavingBank}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700
                                disabled:bg-blue-400 text-white text-sm font-bold rounded-lg
                                transition-colors shadow-sm"
                        >
                            {isSavingBank
                                ? <><Loader2 size={14} className="animate-spin" />Saving...</>
                                : <><Save size={14} />Save Bank</>
                            }
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Warning notice ────────────────────────────────────────────── */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                    <p className="font-bold mb-1">Important — Read before saving</p>
                    <ul className="list-disc list-inside text-xs space-y-1 text-amber-800">
                        <li>
                            Changes are live immediately — the app fetches these details every
                            time a user opens the payment screen.
                        </li>
                        <li>
                            Disabling a method hides it from new users but does{' '}
                            <strong>not</strong> affect pending transactions already submitted.
                        </li>
                        <li>
                            Always verify the account number and IFSC code before enabling
                            bank transfer to avoid misdirected payments.
                        </li>
                        <li>
                            At least one method must be enabled for users to be able to add
                            money to their wallet.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PaymentConfigManager;