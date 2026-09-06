import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchStocks,
    createStock,
    updateStock,
    deleteStock,
    setFilters,
} from '../store/slices/marketSlice';
import {
    TrendingUp,
    Plus,
    Edit2,
    Trash2,
    Star,
    Search,
    Filter,
    RefreshCw,
    X,
    AlertCircle,
    TrendingDown,
} from 'lucide-react';
import Loading from '../components/Loader';

const StocksManagement = () => {
    const dispatch = useDispatch();
    const { stocks, totalStocks, loading, filters } = useSelector((state) => state.market);

    const [showModal, setShowModal] = useState(false);
    const [editingStock, setEditingStock] = useState(null);
    const [deleteModal, setDeleteModal] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        symbol: '',
        currentPrice: '',
        dayChange: '',
        dayChangePercent: '',
        category: 'stock',
        featured: false,
    });

    useEffect(() => {
        dispatch(fetchStocks({ page: 1, limit: 50, ...filters }));
    }, [dispatch, filters]);

    const handleSearch = (e) => {
        e.preventDefault();
        dispatch(setFilters({ search: searchTerm }));
    };

    const handleOpenModal = (stock = null) => {
        if (stock) {
            setEditingStock(stock);
            setFormData({
                name: stock.name,
                symbol: stock.symbol,
                currentPrice: stock.currentPrice,
                dayChange: stock.dayChange || 0,
                dayChangePercent: stock.dayChangePercent || 0,
                category: stock.category || 'stock',
                featured: stock.featured || false,
            });
        } else {
            setEditingStock(null);
            setFormData({
                name: '',
                symbol: '',
                currentPrice: '',
                dayChange: '',
                dayChangePercent: '',
                category: 'stock',
                featured: false,
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingStock(null);
        setFormData({
            name: '',
            symbol: '',
            currentPrice: '',
            dayChange: '',
            dayChangePercent: '',
            category: 'stock',
            featured: false,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.symbol || !formData.currentPrice) {
            alert('Please fill all required fields');
            return;
        }

        try {
            if (editingStock) {
                await dispatch(
                    updateStock({
                        stockId: editingStock._id,
                        data: {
                            ...formData,
                            currentPrice: parseFloat(formData.currentPrice),
                            dayChange: parseFloat(formData.dayChange) || 0,
                            dayChangePercent: parseFloat(formData.dayChangePercent) || 0,
                        },
                    })
                ).unwrap();
                alert('Stock updated successfully!');
            } else {
                await dispatch(
                    createStock({
                        ...formData,
                        currentPrice: parseFloat(formData.currentPrice),
                        dayChange: parseFloat(formData.dayChange) || 0,
                        dayChangePercent: parseFloat(formData.dayChangePercent) || 0,
                    })
                ).unwrap();
                alert('Stock created successfully!');
            }
            handleCloseModal();
            dispatch(fetchStocks({ page: 1, limit: 50, ...filters }));
        } catch (error) {
            alert('Error: ' + error);
        }
    };

    const handleDelete = async () => {
        try {
            await dispatch(deleteStock(deleteModal)).unwrap();
            alert('Stock deleted successfully!');
            setDeleteModal(null);
            dispatch(fetchStocks({ page: 1, limit: 50, ...filters }));
        } catch (error) {
            alert('Error: ' + error);
        }
    };

    const handleToggleFeatured = async (stock) => {
        try {
            await dispatch(
                updateStock({
                    stockId: stock._id,
                    data: { featured: !stock.featured },
                })
            ).unwrap();
            dispatch(fetchStocks({ page: 1, limit: 50, ...filters }));
        } catch (error) {
            alert('Error: ' + error);
        }
    };

    if (loading && stocks.length === 0) {
        return <Loading message="Loading Stocks..." />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">Stocks Management</h1>
                    <p className="text-gray-500 mt-2">
                        Create and manage stocks displayed in the mobile app
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => dispatch(fetchStocks({ page: 1, limit: 50, ...filters }))}
                        className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition flex items-center space-x-2"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition flex items-center space-x-2"
                    >
                        <Plus size={18} />
                        <span>Add Stock</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm mb-1">Total Stocks</p>
                            <p className="text-4xl font-bold">{totalStocks || 0}</p>
                        </div>
                        <TrendingUp size={32} className="opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-100 text-sm mb-1">Featured</p>
                            <p className="text-4xl font-bold">
                                {stocks.filter((s) => s.featured).length}
                            </p>
                        </div>
                        <Star size={32} className="opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm mb-1">Categories</p>
                            <p className="text-4xl font-bold">
                                {new Set(stocks.map((s) => s.category)).size}
                            </p>
                        </div>
                        <Filter size={32} className="opacity-80" />
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <Search
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search stocks by name or symbol..."
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>
                    </form>
                    <button
                        type="submit"
                        onClick={handleSearch}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition flex items-center justify-center space-x-2"
                    >
                        <Search size={18} />
                        <span>Search</span>
                    </button>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition flex items-center justify-center space-x-2"
                    >
                        <Filter size={18} />
                        <span>Filters</span>
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button
                                onClick={() => dispatch(setFilters({ category: '' }))}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filters.category === ''
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                All Categories
                            </button>
                            <button
                                onClick={() => dispatch(setFilters({ category: 'stock' }))}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filters.category === 'stock'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                Stocks
                            </button>
                            <button
                                onClick={() => dispatch(setFilters({ featured: 'true' }))}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filters.featured === 'true'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                Featured Only
                            </button>
                            <button
                                onClick={() => dispatch(setFilters({ category: '', featured: '', search: '' }))}
                                className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Stocks Grid */}
            {stocks.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
                    <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <TrendingUp className="text-gray-400" size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">No Stocks Found</h3>
                    <p className="text-gray-500 mb-6">
                        {searchTerm ? 'Try adjusting your search' : 'Start by adding your first stock'}
                    </p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition inline-flex items-center space-x-2"
                    >
                        <Plus size={18} />
                        <span>Add First Stock</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stocks.map((stock) => (
                        <div
                            key={stock._id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                                        <TrendingUp className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{stock.name}</h3>
                                        <p className="text-sm text-gray-500">{stock.symbol}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggleFeatured(stock)}
                                    className={`p-2 rounded-lg transition ${stock.featured
                                        ? 'bg-yellow-100 text-yellow-600'
                                        : 'bg-gray-100 text-gray-400 hover:bg-yellow-100 hover:text-yellow-600'
                                        }`}
                                >
                                    <Star size={18} className={stock.featured ? 'fill-current' : ''} />
                                </button>
                            </div>

                            {/* Price */}
                            <div className="mb-4">
                                <p className="text-3xl font-bold text-gray-900">
                                    ₹{stock.currentPrice?.toLocaleString()}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                    {stock.dayChangePercent >= 0 ? (
                                        <span className="text-green-600 text-sm font-semibold flex items-center">
                                            <TrendingUp size={14} className="mr-1" />
                                            +{stock.dayChangePercent}%
                                        </span>
                                    ) : (
                                        <span className="text-red-600 text-sm font-semibold flex items-center">
                                            <TrendingDown size={14} className="mr-1" />
                                            {stock.dayChangePercent}%
                                        </span>
                                    )}
                                    <span className="text-gray-500 text-sm">
                                        {stock.dayChange >= 0 ? '+' : ''}₹{stock.dayChange?.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Category */}
                            <div className="mb-4">
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full capitalize">
                                    {stock.category}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleOpenModal(stock)}
                                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg font-medium transition flex items-center justify-center space-x-2"
                                >
                                    <Edit2 size={16} />
                                    <span>Edit</span>
                                </button>
                                <button
                                    onClick={() => setDeleteModal(stock._id)}
                                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg font-medium transition flex items-center justify-center space-x-2"
                                >
                                    <Trash2 size={16} />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900">
                                {editingStock ? 'Edit Stock' : 'Add New Stock'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Stock Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    placeholder="e.g., Reliance Industries"
                                    required
                                />
                            </div>

                            {/* Symbol */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Stock Symbol <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.symbol}
                                    onChange={(e) =>
                                        setFormData({ ...formData, symbol: e.target.value.toUpperCase() })
                                    }
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    placeholder="e.g., RELIANCE"
                                    required
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Current Price (₹) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.currentPrice}
                                    onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    placeholder="e.g., 2456.75"
                                    required
                                />
                            </div>

                            {/* Day Change & Percentage */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Day Change (₹)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.dayChange}
                                        onChange={(e) => setFormData({ ...formData, dayChange: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        placeholder="e.g., 45.30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Day Change (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.dayChangePercent}
                                        onChange={(e) =>
                                            setFormData({ ...formData, dayChangePercent: e.target.value })
                                        }
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        placeholder="e.g., 2.34"
                                    />
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                >
                                    <option value="stock">Stock</option>
                                    <option value="equity">Equity</option>
                                    <option value="commodity">Commodity</option>
                                    <option value="currency">Currency</option>
                                </select>
                            </div>

                            {/* Featured Toggle */}
                            <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                <div className="flex items-center space-x-3">
                                    <Star className="text-yellow-600" size={24} />
                                    <div>
                                        <p className="font-semibold text-gray-900">Featured Stock</p>
                                        <p className="text-sm text-gray-600">Display on home screen</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.featured}
                                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-yellow-500"></div>
                                </label>
                            </div>

                            {/* Buttons */}
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition"
                                >
                                    {editingStock ? 'Update Stock' : 'Create Stock'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-semibold transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="text-red-600" size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Delete Stock?</h3>
                        <p className="text-gray-600 text-center mb-6">
                            This action cannot be undone. The stock will be permanently removed from the system.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleDelete}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setDeleteModal(null)}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-semibold transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StocksManagement;
