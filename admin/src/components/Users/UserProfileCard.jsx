import {
  User,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  Shield,
  BadgeCheck,
  XCircle,
  CircleDashed,
  Hash,
  Wallet,
  Activity,
} from 'lucide-react';

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

const getKycMeta = (kycStatus) => {
  const status = String(kycStatus || '').toLowerCase();

  if (status === 'verified' || status === 'approved') {
    return {
      label: 'Verified',
      className: 'bg-emerald-500/15 text-emerald-50 ring-emerald-300/30',
      icon: Shield,
    };
  }

  if (status === 'pending') {
    return {
      label: 'Pending',
      className: 'bg-amber-500/15 text-amber-50 ring-amber-300/30',
      icon: CircleDashed,
    };
  }

  if (status === 'rejected') {
    return {
      label: 'Rejected',
      className: 'bg-red-500/15 text-red-50 ring-red-300/30',
      icon: XCircle,
    };
  }

  return {
    label: 'Not Started',
    className: 'bg-white/10 text-blue-50 ring-white/20',
    icon: Shield,
  };
};

const getAccountMeta = (user) => {
  if (user?.isActive === false) {
    return {
      label: 'Inactive',
      className: 'bg-red-500/15 text-red-50 ring-red-300/30',
      icon: XCircle,
    };
  }

  if (user?.isVerified) {
    return {
      label: 'Verified',
      className: 'bg-emerald-500/15 text-emerald-50 ring-emerald-300/30',
      icon: CheckCircle,
    };
  }

  return {
    label: 'Unverified',
    className: 'bg-white/10 text-blue-50 ring-white/20',
    icon: BadgeCheck,
  };
};

const buildPhone = (user) => {
  const phone = user?.phoneNumber || user?.phone || '';
  const code = user?.countryCode || '';
  if (!phone) return '-';
  return code ? `${code} ${phone}` : phone;
};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const UserProfileCard = ({ user = {} }) => {
  const joinedDate = formatDate(user.createdAt);
  const accountMeta = getAccountMeta(user);
  const kycMeta = getKycMeta(user.kycStatus);

  const AccountIcon = accountMeta.icon;
  const KycIcon = kycMeta.icon;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 shadow-xl md:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <User className="text-white" size={38} />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold text-white md:text-3xl">
              {user.fullName || user.name || 'Unnamed User'}
            </h2>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-blue-100">
              {(user.phoneNumber || user.phone) && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                  <Phone size={15} />
                  <span>{buildPhone(user)}</span>
                </div>
              )}

              {user.email && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                  <Mail size={15} />
                  <span className="max-w-[220px] truncate">{user.email}</span>
                </div>
              )}

              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <Calendar size={15} />
                <span>Joined {joinedDate}</span>
              </div>

              {user._id && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs md:text-sm">
                  <Hash size={14} />
                  <span>ID: {String(user._id).slice(-8)}</span>
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <div className="flex items-center gap-2 text-blue-100">
                  <Wallet size={16} />
                  <span className="text-xs uppercase tracking-wide">Wallet</span>
                </div>
                <p className="mt-2 text-xl font-bold text-white">
                  {formatCurrency(user.walletBalance || 0)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <div className="flex items-center gap-2 text-blue-100">
                  <Activity size={16} />
                  <span className="text-xs uppercase tracking-wide">Account</span>
                </div>
                <p className="mt-2 text-xl font-bold text-white">
                  {user.isActive === false ? 'Inactive' : 'Active'}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <div className="flex items-center gap-2 text-blue-100">
                  <Shield size={16} />
                  <span className="text-xs uppercase tracking-wide">KYC</span>
                </div>
                <p className="mt-2 text-xl font-bold text-white">
                  {kycMeta.label}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:flex-col xl:items-end">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${accountMeta.className}`}
          >
            <AccountIcon size={14} />
            {accountMeta.label}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${kycMeta.className}`}
          >
            <KycIcon size={14} />
            KYC: {kycMeta.label}
          </span>
        </div>
      </div>
    </section>
  );
};

export default UserProfileCard;