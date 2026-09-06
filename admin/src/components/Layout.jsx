import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import {
  LayoutDashboard,
  Wallet,
  List,
  LogOut,
  User,
  Users,
  TrendingUp,
  Image,
  Layers,
  Menu,
  X,
  ShieldCheckIcon,
  Bell,
  Gift,
  MessageCircle,
} from 'lucide-react';

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { admin } = useSelector((state) => state.auth);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // ✅ Log admin data when component mounts
  useEffect(() => {
    console.log('🔐 Layout mounted with admin:', {
      username: admin?.username,
      role: admin?.role,
      allowedRoutes: admin?.allowedRoutes || []
    });
  }, [admin]);

  const handleLogout = () => {
    console.log('🚪 Logging out...');
    dispatch(logout());
    navigate('/login');
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'moderator':
        return 'Moderator';
      default:
        return 'Admin';
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return { bg: 'bg-gradient-to-r from-blue-500 to-purple-500', text: 'text-white' };
      case 'admin':
        return { bg: 'bg-gradient-to-r from-green-500 to-teal-500', text: 'text-white' };
      case 'moderator':
        return { bg: 'bg-gradient-to-r from-orange-500 to-red-500', text: 'text-white' };
      default:
        return { bg: 'bg-gray-500', text: 'text-white' };
    }
  };

  // ✅ FIXED: Added sub-routes for payment-manager and market
  const allNavItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      description: 'View dashboard statistics'
    },
    {
      path: '/dashboard/banners',
      icon: Image,
      label: 'Banners',
      description: 'Manage app banners'
    },
    {
      path: '/dashboard/market',
      icon: TrendingUp,
      label: 'Top Indices',
      description: 'Manage top indices and market data'
    },
    {
      path: '/dashboard/index-categories',
      icon: Layers,
      label: 'Categories',
      description: 'Manage index categories'
    },
    {
      path: '/dashboard/payment-manager',
      icon: Wallet,
      label: 'Payments',
      description: 'Manage payments and withdrawals'
    },
    {
      path: '/dashboard/transactions',
      icon: List,
      label: 'Transactions',
      description: 'View all transactions'
    },
    {
      path: '/dashboard/users',
      icon: Users,
      label: 'Users',
      description: 'Manage users'
    },
    {
      path: '/dashboard/referrals',
      icon: Gift,
      label: 'Referrals',
      description: 'Manage invite and earn referrals',
    },
    {
      path: '/dashboard/notifications',
      icon: Bell,
      label: 'Notifications',
      description: 'Send push notifications'
    },
    {
      path: '/dashboard/support',
      icon: MessageCircle,
      label: 'Support Chat',
      description: 'Manage live customer support conversations',
    },
    {
      path: '/dashboard/admins',
      icon: ShieldCheckIcon,
      label: 'Admins',
      description: 'Manage admin users'
    }
  ];


  // ✅ Filter nav items based on role AND allowedRoutes
  const navItems = allNavItems.filter(item => {
    // Super admins see everything
    if (admin?.role === 'super_admin') {
      return true;
    }

    // Regular admins only see items in their allowedRoutes
    if (admin?.allowedRoutes && admin.allowedRoutes.length > 0) {
      const hasAccess = admin.allowedRoutes.includes(item.path);
      console.log(`📍 Nav item "${item.label}" (${item.path}):`, hasAccess ? '✅' : '❌');
      return hasAccess;
    }

    // Fallback: no access
    console.warn('⚠️ No allowedRoutes found for admin');
    return false;
  });

  // ✅ Log filtered navigation items
  useEffect(() => {
    console.log('🧭 Filtered navigation items:', navItems.map(i => i.label));
  }, [navItems]);

  const roleBadge = getRoleBadge(admin?.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl z-40 transition-all duration-300 ease-in-out flex flex-col ${isCollapsed ? 'w-20' : 'w-64'
          } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Header with Toggle - Fixed */}
        <div className="flex-shrink-0 p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  TradeHub
                </h1>
                <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
              </div>
            )}

            {/* Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-2 hover:bg-gray-700 rounded-lg transition-all duration-300 ${isCollapsed ? 'mx-auto' : ''
                }`}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <Menu className="text-gray-400" size={20} />
            </button>
          </div>

          {/* Role Badge */}
          {!isCollapsed && (
            <div className="mt-4">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${roleBadge.bg} ${roleBadge.text} shadow-lg`}>
                {getRoleDisplay(admin?.role)}
              </span>
            </div>
          )}
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto sidebar-scroll">
          {navItems.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">
              <p>No navigation items</p>
              <p className="text-xs mt-2">Contact admin</p>
            </div>
          ) : (
            navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  console.log('🔗 Navigating to:', item.path);
                  setIsMobileOpen(false);
                }}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative ${isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
                title={isCollapsed ? item.label : ''}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                    <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </NavLink>
            ))
          )}
        </nav>

        {/* Admin Info - Fixed at Bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-900">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3`}>
            {!isCollapsed ? (
              <>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="text-white" size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white text-sm truncate">
                      {admin?.fullName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {getRoleDisplay(admin?.role)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition group flex-shrink-0"
                  title="Logout"
                >
                  <LogOut className="text-red-400 group-hover:text-red-300" size={18} />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <User className="text-white" size={18} />
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition group"
                  title="Logout"
                >
                  <LogOut className="text-red-400 group-hover:text-red-300" size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main
        className={`min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
      >
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
