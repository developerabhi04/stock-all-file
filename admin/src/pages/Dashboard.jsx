import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardStats } from '../store/slices/dashboardSlice';
import { fetchUsers } from '../store/slices/usersSlice';
import {
    Users,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Activity,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    ShoppingCart,
    Wallet,
    Target,
    Award,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    BarChart3,
    PieChart as PieIcon,
    LineChart as LineIcon,
    Calendar,
    Zap,
    Percent,
    IndianRupee,
    ShoppingBag
} from 'lucide-react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart
} from 'recharts';
import Loading from '../components/Loader';
import { format } from 'date-fns';

const Dashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [refreshing, setRefreshing] = useState(false);
    const [dateRange, setDateRange] = useState('7days');

    const { stats, loading: dashboardLoading } = useSelector((state) => state.dashboard);
    const { totalUsers, filters } = useSelector((state) => state.users);

    // Sample Trading Platform Data - Replace with real API later
    const [tradingData, setTradingData] = useState({
        // Portfolio Overview
        totalInvested: 12500000, // Total money invested in indices by all users
        currentValue: 13750000, // Current portfolio value (invested + returns)
        totalReturns: 1250000, // Total profit generated
        todayPnL: 85000, // Today's profit/loss

        // Order Statistics
        pendingBuyOrders: 45,
        pendingSellOrders: 28,
        completedOrdersToday: 156,
        cancelledOrdersToday: 12,
        totalOrderValue: 3250000, // Total value of orders today

        // Index Performance
        hotIndices: [
            { name: 'Nifty 50', invested: 4500000, currentValue: 4950000, returns: 450000, returnPercent: 10, holders: 245 },
            { name: 'Sensex', invested: 3800000, currentValue: 4104000, returns: 304000, returnPercent: 8, holders: 198 },
            { name: 'Bank Nifty', invested: 2200000, currentValue: 2420000, returns: 220000, returnPercent: 10, holders: 156 },
        ],

        // Daily Trading Volume
        dailyVolume: [
            { date: 'Feb 01', buyOrders: 125, sellOrders: 85, volume: 2850000 },
            { date: 'Feb 02', buyOrders: 145, sellOrders: 95, volume: 3250000 },
            { date: 'Feb 03', buyOrders: 138, sellOrders: 88, volume: 2950000 },
            { date: 'Feb 04', buyOrders: 165, sellOrders: 105, volume: 3650000 },
            { date: 'Feb 05', buyOrders: 178, sellOrders: 112, volume: 3950000 },
            { date: 'Feb 06', buyOrders: 185, sellOrders: 118, volume: 4150000 },
            { date: 'Feb 07', buyOrders: 192, sellOrders: 125, volume: 4350000 },
        ],

        // Index Distribution
        indexDistribution: [
            { name: 'Nifty 50', value: 35, amount: 4500000, color: '#3B82F6' },
            { name: 'Sensex', value: 28, amount: 3800000, color: '#10B981' },
            { name: 'Bank Nifty', value: 18, amount: 2200000, color: '#8B5CF6' },
            { name: 'IT Index', value: 12, amount: 1500000, color: '#F59E0B' },
            { name: 'Others', value: 7, amount: 500000, color: '#EF4444' },
        ],

        // Daily P&L Trend
        dailyPnL: [
            { date: 'Feb 01', pnl: 65000 },
            { date: 'Feb 02', pnl: 78000 },
            { date: 'Feb 03', pnl: 72000 },
            { date: 'Feb 04', pnl: 85000 },
            { date: 'Feb 05', pnl: 92000 },
            { date: 'Feb 06', pnl: 88000 },
            { date: 'Feb 07', pnl: 95000 },
        ],

        // User Activity
        activeTraders: 456, // Users with active holdings
        newUsersToday: 28,
        usersWithPendingOrders: 73,

        // Revenue & Commission
        platformCommission: 125000, // Commission earned from trades
        depositRequests: 32, // Pending add money requests
        withdrawalRequests: 18, // Pending withdrawal requests

        // Order Status Breakdown
        orderStatus: [
            { status: 'Completed', count: 1245, amount: 28500000 },
            { status: 'Pending', count: 73, amount: 1850000 },
            { status: 'Cancelled', count: 48, amount: 950000 },
        ],

        // Top Performing Indices
        topIndices: [
            { name: 'Nifty 50', dailyReturn: 1.8, weeklyReturn: 5.2, holders: 245, invested: 4500000 },
            { name: 'Bank Nifty', dailyReturn: 1.6, weeklyReturn: 4.8, holders: 156, invested: 2200000 },
            { name: 'Sensex', dailyReturn: 1.4, weeklyReturn: 4.2, holders: 198, invested: 3800000 },
            { name: 'IT Index', dailyReturn: 1.2, weeklyReturn: 3.8, holders: 98, invested: 1500000 },
            { name: 'Pharma Index', dailyReturn: 0.9, weeklyReturn: 2.5, holders: 65, invested: 850000 },
        ],

        // Hourly Trading Activity
        hourlyActivity: [
            { hour: '09:00', orders: 45 },
            { hour: '11:00', orders: 85 },
            { hour: '13:00', orders: 125 },
            { hour: '15:00', orders: 165 },
            { hour: '17:00', orders: 95 },
        ],
    });

    useEffect(() => {
        dispatch(fetchDashboardStats());
        dispatch(fetchUsers({ page: 1, limit: 20, ...filters }));
        // TODO: Fetch trading data from API
        // fetchTradingAnalytics();
    }, [dispatch, filters]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchDashboardStats());
        await dispatch(fetchUsers({ page: 1, limit: 20, ...filters }));
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Calculate metrics
    const profitMargin = ((tradingData.totalReturns / tradingData.totalInvested) * 100).toFixed(2);
    const todayReturnPercent = ((tradingData.todayPnL / tradingData.currentValue) * 100).toFixed(2);

    if (dashboardLoading) {
        return <Loading message="Loading Dashboard..." />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            TradeHub Dashboard
                        </h1>
                        <p className="text-gray-600 mt-2 flex items-center gap-2">
                            <Calendar size={16} />
                            {format(new Date(), 'EEEE, MMMM dd, yyyy • hh:mm a')}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="today">Today</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                        </select>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-lg disabled:opacity-50 font-semibold"
                        >
                            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Key Metrics - Portfolio Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Invested */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                            <Wallet size={28} />
                        </div>
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-1 text-blue-100">
                                <ArrowUpRight size={16} />
                                <span className="text-sm font-bold">+15%</span>
                            </div>
                        </div>
                    </div>
                    <h3 className="text-blue-100 text-sm font-medium mb-1">Total Invested</h3>
                    <p className="text-4xl font-bold mb-2">₹{(tradingData.totalInvested / 100000).toFixed(1)}L</p>
                    <p className="text-blue-100 text-xs">All user investments</p>
                </div>

                {/* Current Value */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                            <TrendingUp size={28} />
                        </div>
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-1 text-green-100">
                                <ArrowUpRight size={16} />
                                <span className="text-sm font-bold">+{profitMargin}%</span>
                            </div>
                        </div>
                    </div>
                    <h3 className="text-green-100 text-sm font-medium mb-1">Current Value</h3>
                    <p className="text-4xl font-bold mb-2">₹{(tradingData.currentValue / 100000).toFixed(1)}L</p>
                    <p className="text-green-100 text-xs">Portfolio value</p>
                </div>

                {/* Total Returns */}
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                            <DollarSign size={28} />
                        </div>
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-1 text-purple-100">
                                <Percent size={16} />
                                <span className="text-sm font-bold">{profitMargin}%</span>
                            </div>
                        </div>
                    </div>
                    <h3 className="text-purple-100 text-sm font-medium mb-1">Total Returns</h3>
                    <p className="text-4xl font-bold mb-2">₹{(tradingData.totalReturns / 100000).toFixed(1)}L</p>
                    <p className="text-purple-100 text-xs">All-time profit</p>
                </div>

                {/* Today's P&L */}
                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                            <Activity size={28} />
                        </div>
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-1 text-orange-100">
                                <ArrowUpRight size={16} />
                                <span className="text-sm font-bold">+{todayReturnPercent}%</span>
                            </div>
                        </div>
                    </div>
                    <h3 className="text-orange-100 text-sm font-medium mb-1">Today's P&L</h3>
                    <p className="text-4xl font-bold mb-2">₹{(tradingData.todayPnL / 1000).toFixed(0)}K</p>
                    <p className="text-orange-100 text-xs">Daily returns</p>
                </div>
            </div>

            {/* Order Management Overview */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
                            <ShoppingCart className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Order Management</h3>
                            <p className="text-sm text-gray-500">Real-time order tracking</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold text-green-600">Live</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Pending Buy Orders */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border-2 border-green-200 cursor-pointer hover:shadow-md transition"
                        onClick={() => navigate('/dashboard/orders/pending')}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-green-500 p-2.5 rounded-lg">
                                <TrendingUp className="text-white" size={20} />
                            </div>
                            <span className="text-xs font-bold text-green-600 bg-green-200 px-2 py-1 rounded-full">
                                Buy
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{tradingData.pendingBuyOrders}</p>
                        <p className="text-sm text-gray-600 mt-1">Pending Buy Orders</p>
                    </div>

                    {/* Pending Sell Orders */}
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border-2 border-red-200 cursor-pointer hover:shadow-md transition"
                        onClick={() => navigate('/dashboard/orders/pending')}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-red-500 p-2.5 rounded-lg">
                                <TrendingDown className="text-white" size={20} />
                            </div>
                            <span className="text-xs font-bold text-red-600 bg-red-200 px-2 py-1 rounded-full">
                                Sell
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{tradingData.pendingSellOrders}</p>
                        <p className="text-sm text-gray-600 mt-1">Pending Sell Orders</p>
                    </div>

                    {/* Completed Today */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-blue-500 p-2.5 rounded-lg">
                                <CheckCircle className="text-white" size={20} />
                            </div>
                            <span className="text-xs font-bold text-blue-600 bg-blue-200 px-2 py-1 rounded-full">
                                Done
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{tradingData.completedOrdersToday}</p>
                        <p className="text-sm text-gray-600 mt-1">Completed Today</p>
                    </div>

                    {/* Cancelled */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-gray-500 p-2.5 rounded-lg">
                                <XCircle className="text-white" size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded-full">
                                Cancelled
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{tradingData.cancelledOrdersToday}</p>
                        <p className="text-sm text-gray-600 mt-1">Cancelled Today</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Daily Trading Volume */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Daily Trading Volume</h3>
                            <p className="text-sm text-gray-500">Buy vs Sell orders</p>
                        </div>
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <BarChart3 className="text-blue-600" size={20} />
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={tradingData.dailyVolume}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                            <YAxis stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="buyOrders" fill="#10B981" radius={[8, 8, 0, 0]} name="Buy Orders" />
                            <Bar dataKey="sellOrders" fill="#EF4444" radius={[8, 8, 0, 0]} name="Sell Orders" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* Index Holdings Distribution */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Index Holdings</h3>
                            <p className="text-sm text-gray-500">Investment distribution</p>
                        </div>
                        <div className="bg-purple-100 p-2 rounded-lg">
                            <PieIcon className="text-purple-600" size={20} />
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={tradingData.indexDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name} ${value}%`}
                                outerRadius={100}
                                innerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {tradingData.indexDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name, props) => [`${value}% (₹${(props.payload.amount / 100000).toFixed(1)}L)`, name]} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Daily P&L Trend */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Daily P&L Trend</h3>
                            <p className="text-sm text-gray-500">Returns generated daily</p>
                        </div>
                        <div className="bg-green-100 p-2 rounded-lg">
                            <LineIcon className="text-green-600" size={20} />
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={tradingData.dailyPnL}>
                            <defs>
                                <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                            <YAxis stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                            <Tooltip
                                formatter={(value) => `₹${value.toLocaleString()}`}
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Area type="monotone" dataKey="pnl" stroke="#10B981" fillOpacity={1} fill="url(#colorPnL)" strokeWidth={2} name="P&L" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Hourly Activity */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Hourly Trading Activity</h3>
                            <p className="text-sm text-gray-500">Orders per hour (Today)</p>
                        </div>
                        <div className="bg-orange-100 p-2 rounded-lg">
                            <Activity className="text-orange-600" size={20} />
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={tradingData.hourlyActivity}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="hour" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                            <YAxis stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                            <Tooltip />
                            <Bar dataKey="orders" fill="#F59E0B" radius={[8, 8, 0, 0]} name="Orders" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Hot Indices Performance */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-orange-400 to-red-500 p-3 rounded-xl">
                            <Award className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Hot Indices</h3>
                            <p className="text-sm text-gray-500">Most traded indices</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/indices')}
                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
                    >
                        View All
                        <ArrowUpRight size={16} />
                    </button>
                </div>
                <div className="space-y-4">
                    {tradingData.hotIndices.map((index, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:shadow-md transition border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${i === 0 ? 'bg-yellow-400 text-white' :
                                        i === 1 ? 'bg-gray-300 text-gray-700' :
                                            'bg-orange-400 text-white'
                                    }`}>
                                    {i + 1}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">{index.name}</p>
                                    <p className="text-sm text-gray-500">{index.holders} holders</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-8 text-center">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Invested</p>
                                    <p className="font-bold text-gray-900">₹{(index.invested / 100000).toFixed(1)}L</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Returns</p>
                                    <p className="font-bold text-green-600">+₹{(index.returns / 1000).toFixed(0)}K</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Growth</p>
                                    <p className="font-bold text-blue-600">+{index.returnPercent}%</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Performing Indices Table */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Top Performing Indices</h3>
                        <p className="text-sm text-gray-500">Highest return rates</p>
                    </div>
                    <div className="bg-green-100 p-2 rounded-lg">
                        <Target className="text-green-600" size={20} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-gray-200">
                                <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Index</th>
                                <th className="text-center py-3 px-4 text-xs font-bold text-gray-600 uppercase">Daily Return</th>
                                <th className="text-center py-3 px-4 text-xs font-bold text-gray-600 uppercase">Weekly Return</th>
                                <th className="text-center py-3 px-4 text-xs font-bold text-gray-600 uppercase">Holders</th>
                                <th className="text-right py-3 px-4 text-xs font-bold text-gray-600 uppercase">Invested</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tradingData.topIndices.map((index, i) => (
                                <tr key={i} className="border-b border-gray-100 hover:bg-blue-50 transition">
                                    <td className="py-4 px-4">
                                        <p className="font-semibold text-gray-900">{index.name}</p>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                                            +{index.dailyReturn}%
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                                            +{index.weeklyReturn}%
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <p className="font-semibold text-gray-700">{index.holders}</p>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <p className="font-bold text-gray-900">₹{(index.invested / 100000).toFixed(1)}L</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User & Platform Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-blue-100 p-3 rounded-xl">
                            <Users className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Traders</p>
                            <p className="text-2xl font-bold text-gray-900">{tradingData.activeTraders}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Users:</span>
                            <span className="font-semibold text-gray-900">{totalUsers || 850}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">New Today:</span>
                            <span className="font-semibold text-green-600">+{tradingData.newUsersToday}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-green-100 p-3 rounded-xl">
                            <IndianRupee className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Platform Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">₹{(tradingData.platformCommission / 1000).toFixed(0)}K</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Commission Rate:</span>
                            <span className="font-semibold text-gray-900">1%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">This Month:</span>
                            <span className="font-semibold text-green-600">+₹{tradingData.platformCommission.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-yellow-100 p-3 rounded-xl">
                            <Clock className="text-yellow-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending Actions</p>
                            <p className="text-2xl font-bold text-gray-900">{tradingData.depositRequests + tradingData.withdrawalRequests}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Deposits:</span>
                            <span className="font-semibold text-blue-600">{tradingData.depositRequests}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Withdrawals:</span>
                            <span className="font-semibold text-orange-600">{tradingData.withdrawalRequests}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105"
                    onClick={() => navigate('/dashboard/orders/pending')}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                            <ShoppingCart size={24} />
                        </div>
                        <span className="bg-white text-blue-600 text-sm font-bold px-3 py-1.5 rounded-full">
                            {tradingData.pendingBuyOrders + tradingData.pendingSellOrders}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Pending Orders</h3>
                    <p className="text-blue-100 text-sm">Approve buy/sell</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105"
                    onClick={() => navigate('/dashboard/payment-manager/payments')}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                            <Wallet size={24} />
                        </div>
                        <span className="bg-white text-green-600 text-sm font-bold px-3 py-1.5 rounded-full">
                            {tradingData.depositRequests}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Add Money</h3>
                    <p className="text-green-100 text-sm">Review deposits</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105"
                    onClick={() => navigate('/dashboard/payment-manager/withdrawals')}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                            <TrendingDown size={24} />
                        </div>
                        <span className="bg-white text-purple-600 text-sm font-bold px-3 py-1.5 rounded-full">
                            {tradingData.withdrawalRequests}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Withdrawals</h3>
                    <p className="text-purple-100 text-sm">Process requests</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105"
                    onClick={() => navigate('/dashboard/users')}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                            <Users size={24} />
                        </div>
                        <span className="bg-white text-orange-600 text-sm font-bold px-3 py-1.5 rounded-full">
                            {totalUsers || 850}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Manage Users</h3>
                    <p className="text-orange-100 text-sm">View all traders</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
