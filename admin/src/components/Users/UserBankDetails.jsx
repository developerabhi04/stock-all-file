import {
    Building,
    CreditCard,
    Hash,
    User,
    Smartphone,
    Landmark,
    ShieldCheck,
} from 'lucide-react';

const InfoRow = ({ icon: Icon, label, value, tone = 'blue', mono = false }) => {
    const tones = {
        blue: 'bg-blue-50 border-blue-200 text-blue-600',
        green: 'bg-emerald-50 border-emerald-200 text-emerald-600',
        violet: 'bg-violet-50 border-violet-200 text-violet-600',
        orange: 'bg-orange-50 border-orange-200 text-orange-600',
        pink: 'bg-pink-50 border-pink-200 text-pink-600',
        slate: 'bg-slate-50 border-slate-200 text-slate-600',
    };

    return (
        <div className={`flex items-start gap-4 rounded-2xl border p-4 ${tones[tone] || tones.blue}`}>
            <div className="rounded-xl bg-white p-2.5 shadow-sm">
                <Icon size={18} />
            </div>

            <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide">{label}</p>
                <p className={`break-all text-base font-bold text-slate-900 ${mono ? 'font-mono' : ''}`}>
                    {value || '-'}
                </p>
            </div>
        </div>
    );
};

// const maskAccountNumber = (value) => {
//     const str = String(value || '');
//     if (!str) return '-';
//     if (str.length <= 4) return str;
//     return `••••••${str.slice(-4)}`;
// };

const normalizeBankAccounts = (user = {}) => {
    if (Array.isArray(user.bankAccounts) && user.bankAccounts.length > 0) {
        return user.bankAccounts.map((account, index) => ({
            id: account._id || account.id || `bank-${index}`,
            bankName: account.bankName || account.name || '',
            accountNumber: account.accountNumber || '',
            accountHolderName: account.accountHolderName || account.holderName || user.fullName || '',
            ifscCode: account.ifscCode || '',
            upiId: account.upiId || '',
            accountType: account.accountType || '',
            branchName: account.branchName || '',
            isPrimary: Boolean(account.isPrimary),
            isVerified: Boolean(account.isVerified),
        }));
    }

    if (user.bankDetails) {
        return [
            {
                id: 'legacy-bank-details',
                bankName: user.bankDetails.bankName || '',
                accountNumber: user.bankDetails.accountNumber || '',
                accountHolderName: user.bankDetails.accountHolderName || user.fullName || '',
                ifscCode: user.bankDetails.ifscCode || '',
                upiId: user.bankDetails.upiId || '',
                accountType: user.bankDetails.accountType || '',
                branchName: user.bankDetails.branchName || '',
                isPrimary: true,
                isVerified: Boolean(user.bankDetails.isVerified),
            },
        ];
    }

    return [];
};

const UserBankDetails = ({ user = {} }) => {
    const bankAccounts = normalizeBankAccounts(user);
    const hasBankDetails = bankAccounts.length > 0;

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                        <Building className="text-blue-600" size={22} />
                        Bank Account Details
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">Withdrawal and payout details</p>
                </div>

                <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${hasBankDetails ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}
                >
                    {hasBankDetails ? `${bankAccounts.length} Added` : 'Not Added'}
                </span>
            </div>

            {hasBankDetails ? (
                <div className="space-y-6">
                    {bankAccounts.map((bank) => (
                        <div
                            key={bank.id}
                            className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5"
                        >
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900">
                                        {bank.bankName || 'Bank Account'}
                                    </h4>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {bank.accountType || 'Bank account'}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {bank.isPrimary && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                            <Landmark size={13} />
                                            Primary
                                        </span>
                                    )}

                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${bank.isVerified
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-amber-100 text-amber-700'
                                            }`}
                                    >
                                        <ShieldCheck size={13} />
                                        {bank.isVerified ? 'Verified' : 'Unverified'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {bank.bankName ? (
                                    <InfoRow
                                        icon={Building}
                                        label="Bank Name"
                                        value={bank.bankName}
                                        tone="blue"
                                    />
                                ) : null}

                                {bank.accountHolderName ? (
                                    <InfoRow
                                        icon={User}
                                        label="Account Holder"
                                        value={bank.accountHolderName}
                                        tone="violet"
                                    />
                                ) : null}

                                {bank.accountNumber ? (
                                    <InfoRow
                                        icon={Hash}
                                        label="Account Number"
                                        value={bank.accountNumber}
                                        tone="green"
                                        mono
                                    />
                                ) : null}

                                {bank.ifscCode ? (
                                    <InfoRow
                                        icon={CreditCard}
                                        label="IFSC Code"
                                        value={bank.ifscCode}
                                        tone="orange"
                                        mono
                                    />
                                ) : null}

                                {bank.upiId ? (
                                    <InfoRow
                                        icon={Smartphone}
                                        label="UPI ID"
                                        value={bank.upiId}
                                        tone="pink"
                                        mono
                                    />
                                ) : null}

                                {bank.branchName ? (
                                    <InfoRow
                                        icon={Landmark}
                                        label="Branch"
                                        value={bank.branchName}
                                        tone="slate"
                                    />
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-14 text-center">
                    <Building className="mx-auto mb-4 text-slate-300" size={46} />
                    <p className="font-medium text-slate-600">No bank details added</p>
                    <p className="mt-1 text-sm text-slate-500">
                        User has not added withdrawal details
                    </p>
                </div>
            )}
        </div>
    );
};

export default UserBankDetails;