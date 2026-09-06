import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchStocks, fetchIndices } from '../store/slices/marketSlice';
import {
    TrendingUp,
    BarChart3,
    Plus,
    RefreshCw,
    Star,
    Globe,
} from 'lucide-react';

const MarketOverview = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { stocks, indices, totalStocks, totalIndices, loading } = useSelector(
        (state) => state.market
    );

    useEffect(() => {
        dispatch(fetchStocks({ page: 1, limit: 10 }));
        dispatch(fetchIndices({ page: 1, limit: 10 }));
    }, [dispatch]);

    const handleRefresh = () => {
        dispatch(fetchStocks({ page: 1, limit: 10 }));
        dispatch(fetchIndices({ page: 1, limit: 10 }));
    };

    const featuredStocks = stocks.filter(s => s.featured);
    const featuredIndices = indices.filter(i => i.featured);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">Market Data Management</h1>
                    <p className="text-gray-500 mt-2">
                        Manage stocks, indices, and market data shown in mobile app
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition flex items-center space-x-2"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Stocks */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium mb-1">Total Stocks</p>
                            <p className="text-4xl font-bold">{totalStocks || 0}</p>
                            <p className="text-blue-100 text-xs mt-2">{featuredStocks.length} featured</p>
                        </div>
                        <div className="bg-white bg-opacity-20 w-14 h-14 rounded-xl flex items-center justify-center">
                            <TrendingUp size={28} />
                        </div>
                    </div>
                </div>

                {/* Total Indices */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium mb-1">Total Indices</p>
                            <p className="text-4xl font-bold">{totalIndices || 0}</p>
                            <p className="text-green-100 text-xs mt-2">{featuredIndices.length} featured</p>
                        </div>
                        <div className="bg-white bg-opacity-20 w-14 h-14 rounded-xl flex items-center justify-center">
                            <BarChart3 size={28} />
                        </div>
                    </div>
                </div>

                {/* Featured Stocks */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium mb-1">Featured Stocks</p>
                            <p className="text-4xl font-bold">{featuredStocks.length}</p>
                            <p className="text-purple-100 text-xs mt-2">On home screen</p>
                        </div>
                        <div className="bg-white bg-opacity-20 w-14 h-14 rounded-xl flex items-center justify-center">
                            <Star size={28} />
                        </div>
                    </div>
                </div>

                {/* Featured Indices */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium mb-1">Featured Indices</p>
                            <p className="text-4xl font-bold">{featuredIndices.length}</p>
                            <p className="text-orange-100 text-xs mt-2">On home screen</p>
                        </div>
                        <div className="bg-white bg-opacity-20 w-14 h-14 rounded-xl flex items-center justify-center">
                            <Globe size={28} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">


                {/* Indices Management Card */}
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl border-2 border-green-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-green-500 w-12 h-12 rounded-xl flex items-center justify-center">
                            <BarChart3 className="text-white" size={24} />
                        </div>
                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            {totalIndices} Indices
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Indices Management</h3>
                    <p className="text-gray-600 text-sm mb-4">
                        Create, edit, and manage market indices shown in the app
                    </p>
                    <button
                        onClick={() => navigate('/dashboard/market/indices')}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center space-x-2"
                    >
                        <span>Manage Indices</span>
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Recent Activity Preview */}
            {/* <div className="grid grid-cols-1 md:grid-cols-q gap-2"> */}


            {/* Recent Indices */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Recent Indices</h3>
                    <button
                        onClick={() => navigate('/dashboard/market/indices')}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                        View All →
                    </button>
                </div>
                <div className="space-y-3">
                    {indices.slice(0, 5).map((index) => (
                        <div
                            key={index._id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                        >
                            <div>
                                <p className="font-semibold text-gray-900">{index.name}</p>
                                <p className="text-xs text-gray-500">{index.symbol}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900">{index.currentValue?.toLocaleString()}</p>
                                {index.featured && (
                                    <span className="inline-flex items-center text-xs text-yellow-600">
                                        <Star size={12} className="mr-1 fill-current" />
                                        Featured
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        // </div>
    );
};

export default MarketOverview;
