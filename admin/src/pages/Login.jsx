import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, clearError } from '../store/slices/authSlice';
import { Lock, User, AlertCircle, Eye, EyeOff, TrendingUp } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, isAuthenticated, admin } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && admin) {
      console.log('✅ Already authenticated:', {
        role: admin.role,
        allowedRoutes: admin.allowedRoutes
      });

      if (admin.role === 'super_admin') {
        navigate('/dashboard');
      } else if (admin.allowedRoutes && admin.allowedRoutes.length > 0) {
        navigate(admin.allowedRoutes[0]);
      } else {
        navigate('/dashboard/payment-manager');
      }
    }
  }, [isAuthenticated, admin, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔵 Attempting login for:', username);

    const result = await dispatch(login({ username, password }));

    if (login.fulfilled.match(result)) {
      const adminData = result.payload.admin;
      console.log('✅ Login successful:', {
        username: adminData.username,
        role: adminData.role,
        allowedRoutes: adminData.allowedRoutes
      });

      if (adminData.role === 'super_admin') {
        navigate('/dashboard');
      } else if (adminData.allowedRoutes && adminData.allowedRoutes.length > 0) {
        navigate(adminData.allowedRoutes[0]);
      } else {
        navigate('/dashboard/payment-manager');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background glow blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#00D09C]/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#00B386]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-[30%] right-[10%] w-72 h-72 bg-[#00D09C]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Glass card */}
      <div className="relative bg-white/[0.07] backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/50 w-full max-w-md p-8 border border-white/[0.12] ring-1 ring-white/5">
        {/* Inner highlight */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none"></div>

        {/* Logo */}
        <div className="text-center mb-8 relative z-10">
          <div className="bg-gradient-to-br from-[#00D09C] to-[#00997a] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#00D09C]/40 ring-1 ring-white/20">
            <TrendingUp className="text-white" size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Trade<span className="text-[#00D09C]">Hub</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Admin Management Portal</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-6 flex items-center relative z-10">
            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-[#00D09C] transition-colors" size={20} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/[0.05] border border-white/[0.12] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00D09C]/50 focus:border-[#00D09C]/50 outline-none transition-all backdrop-blur-sm"
                placeholder="Enter username"
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password with visibility toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-[#00D09C] transition-colors" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 bg-white/[0.05] border border-white/[0.12] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00D09C]/50 focus:border-[#00D09C]/50 outline-none transition-all backdrop-blur-sm"
                placeholder="Enter password"
                required
                disabled={loading}
                autoComplete="current-password"
              />
              
              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={loading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#00D09C] transition-colors focus:outline-none disabled:opacity-50"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#00D09C] to-[#00B386] hover:from-[#00E0A9] hover:to-[#00C494] text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#00D09C]/30 hover:shadow-[#00D09C]/50 hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500 relative z-10">
          <div className="h-px bg-white/10 mb-4"></div>
          <p className="text-xs">Secured by TradeHub • Admin access only</p>
        </div>
      </div>
    </div>
  );
};

export default Login;