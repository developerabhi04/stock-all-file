import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchIndices,
    createIndex,
    updateIndex,
    deleteIndex,
    setFilters,
} from '../store/slices/marketSlice';
import { adminAPI } from '../services/api';
import {
    BarChart3,
    Plus,
    Edit2,
    Trash2,
    Star,
    Search,
    Filter,
    RefreshCw,
    X,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Globe,
    Coins,
    Wallet,
} from 'lucide-react';
import Loading from '../components/Loader';

const initialFormData = {
    name: '',
    symbol: '',
    category: '',
    currentValue: '',
    highValue: '',
    lowValue: '',
    previousClose: '',
    defaultDailyRate: '',
    minimumInvestment: '',
    lockPeriodDays: '',
    logoUrl: '',
    isFeatured: false,
    isActive: true,
    marketCap: '',
    volume: '',
    description: '',
};

const toNumberOrZero = (value) => {
    if (value === '' || value === null || value === undefined) return 0;
    const num = Number(value);
    return Number.isNaN(num) ? 0 : num;
};

const toOptionalNumber = (value) => {
    if (value === '' || value === null || value === undefined) return 0;
    const num = Number(value);
    return Number.isNaN(num) ? 0 : num;
};

const normalizeCategoryLabel = (item) =>
    item?.categoryName || item?.category?.name || '';

const normalizeCategorySlug = (item) =>
    item?.categorySlug || item?.category?.slug || '';

const getCategoryType = (item) => {
    const label = normalizeCategoryLabel(item).toLowerCase();
    const slug = normalizeCategorySlug(item).toLowerCase();

    if (label.includes('global') || slug.includes('global')) return 'Global';
    if (label.includes('crypto') || slug.includes('crypto')) return 'Crypto';
    return 'Indian';
};

const IndicesManagement = () => {
    const dispatch = useDispatch();

    const {
        indices = [],
        totalIndices = 0,
        loading,
        filters,
        actionLoading,
    } = useSelector((state) => state.market);

    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [deleteModal, setDeleteModal] = useState(null);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [showFilters, setShowFilters] = useState(false);
    const [formData, setFormData] = useState(initialFormData);

    const loadIndices = async () => {
        await dispatch(
            fetchIndices({
                page: 1,
                limit: 50,
                category: filters?.category || '',
                featured: filters?.featured || '',
                search: filters?.search || '',
            })
        );
    };

    const loadCategories = async () => {
        try {
            const response = await adminAPI.getAllCategories();
            const raw = response?.data?.data;
            const nextCategories = Array.isArray(raw?.categories)
                ? raw.categories
                : Array.isArray(raw)
                    ? raw
                    : [];
            setCategories(nextCategories.filter(Boolean));
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setCategories([]);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        dispatch(
            fetchIndices({
                page: 1,
                limit: 50,
                category: filters?.category || '',
                featured: filters?.featured || '',
                search: filters?.search || '',
            })
        );
    }, [dispatch, filters]);

    const stats = useMemo(() => {
        const list = Array.isArray(indices) ? indices : [];
        return {
            total: totalIndices || list.length || 0,
            indian: list.filter((i) => getCategoryType(i) === 'Indian').length,
            global: list.filter((i) => getCategoryType(i) === 'Global').length,
            crypto: list.filter((i) => getCategoryType(i) === 'Crypto').length,
            featured: list.filter((i) => !!i?.isFeatured).length,
        };
    }, [indices, totalIndices]);

    const handleSearch = (e) => {
        e?.preventDefault?.();
        dispatch(setFilters({ search: searchTerm }));
    };

    const handleOpenModal = (index = null) => {
        if (index) {
            setEditingIndex(index);
            setFormData({
                name: index?.name || '',
                symbol: index?.symbol || '',
                category: index?.categoryId || index?.category?._id || index?.category?.id || '',
                currentValue: index?.currentValue ?? '',
                highValue: index?.highValue ?? '',
                lowValue: index?.lowValue ?? '',
                previousClose: index?.previousClose ?? '',
                defaultDailyRate: index?.defaultDailyRate ?? '',
                minimumInvestment: index?.minimumInvestment ?? '',
                lockPeriodDays: index?.lockPeriodDays ?? '',
                logoUrl: index?.logoUrl || '',
                isFeatured: !!index?.isFeatured,
                isActive: typeof index?.isActive === 'boolean' ? index.isActive : true,
                marketCap: index?.marketCap ?? '',
                volume: index?.volume ?? '',
                description: index?.description || '',
            });
        } else {
            setEditingIndex(null);
            setFormData(initialFormData);
        }

        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingIndex(null);
        setFormData(initialFormData);
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const validateForm = () => {
        if (
            !formData.name.trim() ||
            !formData.symbol.trim() ||
            !formData.category ||
            formData.currentValue === '' ||
            formData.highValue === '' ||
            formData.lowValue === '' ||
            formData.previousClose === '' ||
            formData.minimumInvestment === '' ||
            formData.lockPeriodDays === ''
        ) {
            return 'Please fill all required fields.';
        }

        if (Number(formData.minimumInvestment) <= 0) {
            return 'Minimum investment must be greater than 0.';
        }

        if (Number(formData.lockPeriodDays) <= 0) {
            return 'Lock period days must be greater than 0.';
        }

        return null;
    };

    const buildPayload = () => ({
        name: formData.name.trim(),
        symbol: formData.symbol.trim().toUpperCase(),
        category: formData.category,
        currentValue: toNumberOrZero(formData.currentValue),
        highValue: toNumberOrZero(formData.highValue),
        lowValue: toNumberOrZero(formData.lowValue),
        previousClose: toNumberOrZero(formData.previousClose),
        defaultDailyRate: toOptionalNumber(formData.defaultDailyRate),
        minimumInvestment: toNumberOrZero(formData.minimumInvestment),
        lockPeriodDays: toNumberOrZero(formData.lockPeriodDays),
        logoUrl: formData.logoUrl?.trim() || '',
        isFeatured: !!formData.isFeatured,
        isActive: !!formData.isActive,
        marketCap: toOptionalNumber(formData.marketCap),
        volume: toOptionalNumber(formData.volume),
        description: formData.description?.trim() || '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            alert(validationError);
            return;
        }

        const payload = buildPayload();

        try {
            if (editingIndex?._id) {
                await dispatch(
                    updateIndex({
                        indexId: editingIndex._id,
                        data: payload,
                    })
                ).unwrap();
                alert('Index updated successfully!');
            } else {
                await dispatch(createIndex(payload)).unwrap();
                alert('Index created successfully!');
            }

            handleCloseModal();
            await loadIndices();
        } catch (error) {
            alert(error || 'Something went wrong');
        }
    };

    const handleDelete = async () => {
        if (!deleteModal) return;

        try {
            await dispatch(deleteIndex(deleteModal)).unwrap();
            alert('Index deleted successfully!');
            setDeleteModal(null);
            await loadIndices();
        } catch (error) {
            alert(error || 'Failed to delete index');
        }
    };

    const handleToggleFeatured = async (index) => {
        if (!index?._id) return;

        try {
            const payload = {
                name: index?.name || '',
                symbol: index?.symbol || '',
                category: index?.categoryId || index?.category?._id || index?.category?.id || '',
                currentValue: toNumberOrZero(index?.currentValue),
                highValue: toNumberOrZero(index?.highValue),
                lowValue: toNumberOrZero(index?.lowValue),
                previousClose: toNumberOrZero(index?.previousClose),
                defaultDailyRate: toOptionalNumber(index?.defaultDailyRate),
                minimumInvestment: toNumberOrZero(index?.minimumInvestment),
                lockPeriodDays: toNumberOrZero(index?.lockPeriodDays),
                logoUrl: index?.logoUrl || '',
                isFeatured: !index?.isFeatured,
                isActive: typeof index?.isActive === 'boolean' ? index.isActive : true,
                marketCap: toOptionalNumber(index?.marketCap),
                volume: toOptionalNumber(index?.volume),
                description: index?.description || '',
            };

            await dispatch(
                updateIndex({
                    indexId: index._id,
                    data: payload,
                })
            ).unwrap();

            await loadIndices();
        } catch (error) {
            alert(error || 'Failed to update featured status');
        }
    };

    const getCategoryIcon = (item) => {
        const type = getCategoryType(item);

        switch (type) {
            case 'Indian':
                return <BarChart3 className="text-white" size={24} />;
            case 'Global':
                return <Globe className="text-white" size={24} />;
            case 'Crypto':
                return <Coins className="text-white" size={24} />;
            default:
                return <BarChart3 className="text-white" size={24} />;
        }
    };

    const getCategoryColor = (item) => {
        const type = getCategoryType(item);

        switch (type) {
            case 'Indian':
                return 'from-blue-400 to-blue-600';
            case 'Global':
                return 'from-green-400 to-green-600';
            case 'Crypto':
                return 'from-orange-400 to-orange-600';
            default:
                return 'from-gray-400 to-gray-600';
        }
    };

    const getCategoryBadge = (item) => {
        const type = getCategoryType(item);

        switch (type) {
            case 'Indian':
                return 'bg-blue-100 text-blue-700';
            case 'Global':
                return 'bg-purple-100 text-purple-700';
            case 'Crypto':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const filterByCategorySlug = async (slugValue) => {
        dispatch(setFilters({ category: slugValue }));
    };

    if (loading && (!indices || indices.length === 0)) {
        return <Loading message="Loading Indices..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">Indices Management</h1>
                    <p className="text-gray-500 mt-2">
                        Create and manage market indices displayed in the mobile app
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={loadIndices}
                        className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition flex items-center space-x-2"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>

                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition flex items-center space-x-2"
                    >
                        <Plus size={18} />
                        <span>Add Index</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm mb-1">Total Indices</p>
                            <p className="text-4xl font-bold">{stats.total}</p>
                        </div>
                        <BarChart3 size={32} className="opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm mb-1">Indian</p>
                            <p className="text-4xl font-bold">{stats.indian}</p>
                        </div>
                        <BarChart3 size={32} className="opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm mb-1">Global</p>
                            <p className="text-4xl font-bold">{stats.global}</p>
                        </div>
                        <Globe size={32} className="opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm mb-1">Crypto</p>
                            <p className="text-4xl font-bold">{stats.crypto}</p>
                        </div>
                        <Coins size={32} className="opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-100 text-sm mb-1">Featured</p>
                            <p className="text-4xl font-bold">{stats.featured}</p>
                        </div>
                        <Star size={32} className="opacity-80" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search indices by name or symbol..."
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                            />
                        </div>
                    </form>

                    <button
                        type="button"
                        onClick={handleSearch}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition flex items-center justify-center space-x-2"
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
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <button
                                onClick={() => dispatch(setFilters({ category: '' }))}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${!filters?.category
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                All Categories
                            </button>

                            {categories.map((cat) => (
                                <button
                                    key={cat?._id || cat?.id}
                                    onClick={() => filterByCategorySlug(cat?.slug || cat?.name || '')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filters?.category === (cat?.slug || cat?.name)
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    {cat?.name}
                                </button>
                            ))}

                            <button
                                onClick={() => dispatch(setFilters({ featured: true }))}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filters?.featured === true
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                Featured
                            </button>

                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    dispatch(setFilters({ category: '', featured: '', search: '' }));
                                }}
                                className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {indices.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
                    <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BarChart3 className="text-gray-400" size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">No Indices Found</h3>
                    <p className="text-gray-500 mb-6">
                        {searchTerm ? 'Try adjusting your search' : 'Start by adding your first index'}
                    </p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition inline-flex items-center space-x-2"
                    >
                        <Plus size={18} />
                        <span>Add First Index</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {indices.map((index) => {
                        const categoryLabel = normalizeCategoryLabel(index) || getCategoryType(index);

                        const hasMinimumInvestment =
                            index?.minimumInvestment !== null &&
                            index?.minimumInvestment !== undefined &&
                            Number(index?.minimumInvestment) > 0;

                        return (
                            <div
                                key={index?._id || index?.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        {index?.logoUrl ? (
                                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                                                <img
                                                    src={index.logoUrl}
                                                    alt={index.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <div
                                                className={`w-12 h-12 bg-gradient-to-br ${getCategoryColor(
                                                    index
                                                )} rounded-xl flex items-center justify-center`}
                                            >
                                                {getCategoryIcon(index)}
                                            </div>
                                        )}

                                        <div>
                                            <h3 className="font-bold text-gray-900">{index?.name}</h3>
                                            <p className="text-sm text-gray-500">{index?.symbol}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleToggleFeatured(index)}
                                        className={`p-2 rounded-lg transition ${index?.isFeatured
                                            ? 'bg-yellow-100 text-yellow-600'
                                            : 'bg-gray-100 text-gray-400 hover:bg-yellow-100 hover:text-yellow-600'
                                            }`}
                                    >
                                        <Star size={18} className={index?.isFeatured ? 'fill-current' : ''} />
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <p className="text-3xl font-bold text-gray-900">
                                        {Number(index?.currentValue || 0).toLocaleString()}
                                    </p>

                                    <div className="flex items-center space-x-2 mt-1">
                                        {Number(index?.changePercent || 0) > 0 ? (
                                            <span className="text-green-600 text-sm font-semibold flex items-center">
                                                <TrendingUp size={14} className="mr-1" />
                                                {Number(index?.changePercent || 0).toFixed(2)}%
                                            </span>
                                        ) : Number(index?.changePercent || 0) < 0 ? (
                                            <span className="text-red-600 text-sm font-semibold flex items-center">
                                                <TrendingDown size={14} className="mr-1" />
                                                {Math.abs(Number(index?.changePercent || 0)).toFixed(2)}%
                                            </span>
                                        ) : (
                                            <span className="text-gray-500 text-sm">0.00%</span>
                                        )}

                                        <span className="text-gray-500 text-sm">
                                            {Number(index?.change || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-4 flex items-center justify-between">
                                    <span
                                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full capitalize ${getCategoryBadge(
                                            index
                                        )}`}
                                    >
                                        {categoryLabel}
                                    </span>

                                    {index?.isFeatured && (
                                        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                                            Top Index
                                        </span>
                                    )}
                                </div>

                                <div
                                    className={`mb-3 flex items-center space-x-2 rounded-lg px-3 py-2 border ${hasMinimumInvestment
                                        ? 'bg-emerald-50 border-emerald-200'
                                        : 'bg-orange-50 border-orange-200'
                                        }`}
                                >
                                    <Wallet
                                        size={16}
                                        className={hasMinimumInvestment ? 'text-emerald-600' : 'text-orange-600'}
                                    />
                                    <p
                                        className={`text-sm font-semibold ${hasMinimumInvestment ? 'text-emerald-700' : 'text-orange-700'
                                            }`}
                                    >
                                        {hasMinimumInvestment
                                            ? `Min. Investment ₹${Number(index?.minimumInvestment).toLocaleString('en-IN')}`
                                            : 'Min. Investment Not set'}
                                    </p>
                                </div>

                                <div className="mb-4 flex items-center space-x-2 rounded-lg px-3 py-2 border bg-blue-50 border-blue-200">
                                    <span className="text-sm font-semibold text-blue-700">
                                        Period:{' '}
                                        {Number(index?.lockPeriodDays || 0) > 0
                                            ? `${Number(index?.lockPeriodDays)} Days`
                                            : 'Not set'}
                                    </span>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleOpenModal(index)}
                                        className="flex-1 bg-green-50 hover:bg-green-100 text-green-600 py-2 rounded-lg font-medium transition flex items-center justify-center space-x-2"
                                    >
                                        <Edit2 size={16} />
                                        <span>Edit</span>
                                    </button>

                                    <button
                                        onClick={() => setDeleteModal(index?._id)}
                                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg font-medium transition flex items-center justify-center space-x-2"
                                    >
                                        <Trash2 size={16} />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900">
                                {editingIndex ? 'Edit Index' : 'Add New Index'}
                            </h3>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Index Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                    placeholder="e.g., NIFTY 50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Index Symbol <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.symbol}
                                    onChange={(e) => handleChange('symbol', e.target.value.toUpperCase())}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                    placeholder="e.g., NIFTY"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => handleChange('category', e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat?._id || cat?.id} value={cat?._id || cat?.id}>
                                            {cat?.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Last open <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.currentValue}
                                        onChange={(e) => handleChange('currentValue', e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                        placeholder="19435.30"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Last Close <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.previousClose}
                                        onChange={(e) => handleChange('previousClose', e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                        placeholder="19390.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        52 weeks/High  <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.highValue}
                                        onChange={(e) => handleChange('highValue', e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                        placeholder="19500.00"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        52 weeks/Low  <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.lowValue}
                                        onChange={(e) => handleChange('lowValue', e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                        placeholder="19350.00"
                                        required
                                    />
                                </div>



                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Minimum Investment <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        min="1"
                                        value={formData.minimumInvestment}
                                        onChange={(e) => handleChange('minimumInvestment', e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                        placeholder="e.g. 2000"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Users can invest any amount above this minimum, based on available wallet balance.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Default Daily Return
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.defaultDailyRate}
                                        onChange={(e) => handleChange('defaultDailyRate', e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                        placeholder="e.g., 1 or 2"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Shows fixed daily return in the app and can be used as default return.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Period Days <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        min="1"
                                        value={formData.lockPeriodDays}
                                        onChange={(e) => handleChange('lockPeriodDays', e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                        placeholder="e.g. 20 or 30"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Set how many days this index investment stays locked.
                                    </p>
                                </div>

                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Logo URL / Image Path
                                </label>
                                <input
                                    type="text"
                                    value={formData.logoUrl}
                                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                    placeholder="https://example.com/logo.png or /uploads/indices/nifty50.png"
                                />
                                {formData.logoUrl ? (
                                    <div className="mt-3 w-16 h-16 rounded-xl border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
                                        <img
                                            src={formData.logoUrl}
                                            alt="Logo preview"
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                ) : null}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Market Cap
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.marketCap}
                                        onChange={(e) => handleChange('marketCap', e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                        placeholder="Optional"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Volume
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.volume}
                                        onChange={(e) => handleChange('volume', e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                    placeholder="Short description"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <Star className="text-yellow-600" size={24} />
                                        <div>
                                            <p className="font-semibold text-gray-900">Featured Index</p>
                                            <p className="text-sm text-gray-600">Show in Top Indices</p>
                                        </div>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isFeatured}
                                            onChange={(e) => handleChange('isFeatured', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-yellow-500 peer-checked:after:translate-x-full" />
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <div>
                                        <p className="font-semibold text-gray-900">Active Status</p>
                                        <p className="text-sm text-gray-600">Visible in app APIs</p>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => handleChange('isActive', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500 peer-checked:after:translate-x-full" />
                                    </label>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition"
                                >
                                    {actionLoading
                                        ? editingIndex
                                            ? 'Updating...'
                                            : 'Creating...'
                                        : editingIndex
                                            ? 'Update Index'
                                            : 'Create Index'}
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

            {deleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="text-red-600" size={32} />
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                            Delete Index?
                        </h3>

                        <p className="text-gray-600 text-center mb-6">
                            This action cannot be undone. The index will be permanently removed from the system.
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

export default IndicesManagement;