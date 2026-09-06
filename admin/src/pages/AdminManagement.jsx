import { useState, useEffect } from 'react';
import { Trash2, Shield, ShieldCheck, Eye, X, UserPlus } from 'lucide-react';
import { adminAPI } from '../services/api';
import PageHeader from './paymentmanager/PageHeader';
import {
    LayoutDashboard,
    Users,
    FileCheck,
    Wallet,
    List,
    TrendingUp,
    Layers,
    Image,
    Bell,
    BarChart3,
    ShieldCheck as ShieldCheckIcon
} from 'lucide-react';
import Loading from '../components/Loader';

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [adminActivity, setAdminActivity] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        email: '',
        allowedRoutes: []
    });

    // ✅ All available navigation items
    const allNavItems = [
        {
            path: '/dashboard',
            icon: LayoutDashboard,
            label: 'Dashboard',
            description: 'View dashboard statistics'
        },
        {
            path: '/dashboard/users',
            icon: Users,
            label: 'Users',
            description: 'Manage users'
        },
        {
            path: '/dashboard/kyc',
            icon: FileCheck,
            label: 'KYC',
            description: 'Verify KYC documents'
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
            path: '/dashboard/market',
            icon: TrendingUp,
            label: 'Market',
            description: 'Manage market data'
        },
        {
            path: '/dashboard/index-categories',
            icon: Layers,
            label: 'Categories',
            description: 'Manage index categories'
        },
        {
            path: '/dashboard/banners',
            icon: Image,
            label: 'Banners',
            description: 'Manage app banners'
        },
        {
            path: '/dashboard/notifications',
            icon: Bell,
            label: 'Notifications',
            description: 'Send push notifications'
        },
        {
            path: '/dashboard/reports',
            icon: BarChart3,
            label: 'Reports',
            description: 'View analytics and reports'
        },
        {
            path: '/dashboard/admins',
            icon: ShieldCheckIcon,
            label: 'Admins',
            description: 'Manage admin users'
        },
    ];

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getAllAdmins();
            console.log('📥 Fetched admins:', response.data.data.admins);
            setAdmins(response.data.data.admins || []);
        } catch (error) {
            console.error('Error fetching admins:', error);
            alert('Failed to fetch admins');
            setAdmins([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminActivity = async (adminId) => {
        try {
            setActivityLoading(true);
            const response = await adminAPI.getAdminActivity(adminId);
            setAdminActivity(response.data.data.activities || []);
        } catch (error) {
            console.error('Error fetching admin activity:', error);
            setAdminActivity([]);
        } finally {
            setActivityLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // ✅ Handle route permission toggle
    const handleRouteToggle = (routePath) => {
        setFormData(prev => {
            const allowedRoutes = prev.allowedRoutes.includes(routePath)
                ? prev.allowedRoutes.filter(r => r !== routePath)
                : [...prev.allowedRoutes, routePath];

            return { ...prev, allowedRoutes };
        });
    };

    // ✅ Select all routes
    const handleSelectAll = () => {
        setFormData(prev => ({
            ...prev,
            allowedRoutes: allNavItems.map(item => item.path)
        }));
    };

    // ✅ Deselect all routes
    const handleDeselectAll = () => {
        setFormData(prev => ({
            ...prev,
            allowedRoutes: []
        }));
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();

        // ✅ Prevent double submission
        if (submitting) {
            console.log('⚠️ Already submitting, please wait...');
            return;
        }

        if (!formData.username || !formData.password || !formData.fullName || !formData.email) {
            alert('Please fill in all required fields');
            return;
        }

        if (formData.username.length < 3) {
            alert('Username must be at least 3 characters');
            return;
        }

        if (formData.password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        if (formData.allowedRoutes.length === 0) {
            alert('Please select at least one navigation item');
            return;
        }

        try {
            setSubmitting(true);
            console.log('🔵 Submitting admin creation:', formData);

            const response = await adminAPI.createAdmin(formData);

            console.log('✅ Admin created:', response.data);
            alert('✅ Admin created successfully!');

            setShowModal(false);
            resetForm();
            fetchAdmins();
        } catch (error) {
            console.error('❌ Error creating admin:', error);
            alert(error.response?.data?.message || 'Failed to create admin');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAdmin = async (id, username) => {
        if (!confirm(`Are you sure you want to delete admin "${username}"?`)) return;

        try {
            await adminAPI.deleteAdmin(id);
            alert('✅ Admin deleted successfully!');
            fetchAdmins();
        } catch (error) {
            console.error('Error deleting admin:', error);
            alert(error.response?.data?.message || 'Failed to delete admin');
        }
    };

    const handleViewActivity = (admin) => {
        setSelectedAdmin(admin);
        setShowActivityModal(true);
        fetchAdminActivity(admin._id);
    };

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
            fullName: '',
            email: '',
            allowedRoutes: []
        });
    };

    // ✅ Separate admins: super_admin and regular admins
    const superAdmin = admins.find(a => a.role === 'super_admin');
    const regularAdmins = admins.filter(a => a.role === 'admin');

    if (loading) {
        return <Loading message="Loading Admin Management..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Admin Management"
                subtitle={`Manage admin users and permissions (${regularAdmins.length} admins)`}
            />

            {/* Stats & Create Button */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex gap-6">
                    <div>
                        <p className="text-sm text-gray-600">Total Admins</p>
                        <p className="text-2xl font-bold text-gray-900">{regularAdmins.length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Active</p>
                        <p className="text-2xl font-bold text-green-600">
                            {regularAdmins.filter(a => a.isActive).length}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Created This Month</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {regularAdmins.filter(a => {
                                const created = new Date(a.createdAt);
                                const now = new Date();
                                return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                            }).length}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <UserPlus size={20} />
                    Create Admin
                </button>
            </div>

            {/* Super Admin Card */}
            {superAdmin && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <ShieldCheck className="text-white" size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">{superAdmin.fullName}</h3>
                                <p className="text-blue-100">@{superAdmin.username}</p>
                                <p className="text-sm text-blue-100 mt-1">📧 {superAdmin.email}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                                ⭐ Super Admin
                            </span>
                            <p className="text-xs text-blue-100 mt-2">Full System Access</p>
                            <p className="text-xs text-blue-100">Cannot be deleted</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Admins Grid */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Admins ({regularAdmins.length})</h3>

                {regularAdmins.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <Shield className="mx-auto text-gray-400 mb-4" size={48} />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No admins yet</h3>
                        <p className="text-gray-600 mb-4">Create your first admin to get started</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Create Admin
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {regularAdmins.map((admin) => {
                            return (
                                <div
                                    key={admin._id}
                                    className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition"
                                >
                                    {/* Header */}
                                    <div className="p-6 border-b border-gray-200">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center shadow-lg">
                                                    <Shield className="text-white" size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg">{admin.fullName}</h3>
                                                    <p className="text-sm text-gray-500">@{admin.username}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Role Badge */}
                                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md">
                                            Admin
                                        </span>
                                    </div>

                                    {/* Details */}
                                    <div className="p-4 bg-gray-50 space-y-2">
                                        {admin.email && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-600">📧</span>
                                                <span className="text-gray-700 truncate">{admin.email}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-600">📅</span>
                                            <span className="text-gray-700">
                                                Joined {new Date(admin.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {admin.lastLogin && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-600">🕐</span>
                                                <span className="text-gray-700">
                                                    Last login: {new Date(admin.lastLogin).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                        {/* ✅ Show allowed routes count */}
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-600">🔐</span>
                                            <span className="text-gray-700 font-medium">
                                                {admin.allowedRoutes?.length || 0} navigation access
                                            </span>
                                        </div>
                                        {/* ✅ Show which pages they can access */}
                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                            <p className="text-xs text-gray-500 mb-1">Access to:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {admin.allowedRoutes?.slice(0, 3).map((route) => {
                                                    const item = allNavItems.find(i => i.path === route);
                                                    return item ? (
                                                        <span key={route} className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                                            {item.label}
                                                        </span>
                                                    ) : null;
                                                })}
                                                {admin.allowedRoutes?.length > 3 && (
                                                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                                        +{admin.allowedRoutes.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="p-4 flex gap-2">
                                        <button
                                            onClick={() => handleViewActivity(admin)}
                                            className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition"
                                        >
                                            <Eye size={16} />
                                            <span className="text-sm font-medium">Activity</span>
                                        </button>

                                        <button
                                            onClick={() => handleDeleteAdmin(admin._id, admin.username)}
                                            className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition"
                                        >
                                            <Trash2 size={16} />
                                            <span className="text-sm font-medium">Delete</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Admin Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Create New Admin</h2>
                                <p className="text-sm text-gray-600 mt-1">Give custom access to navigation items</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                                disabled={submitting}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Username */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Username *
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        placeholder="e.g., john.doe"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                        minLength={3}
                                        disabled={submitting}
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="john@example.com"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="e.g., John Doe"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                        disabled={submitting}
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Minimum 6 characters"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                        minLength={6}
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            {/* ✅ Navigation Permissions */}
                            <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        📍 Navigation Access *
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleSelectAll}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                            disabled={submitting}
                                        >
                                            Select All
                                        </button>
                                        <span className="text-gray-400">|</span>
                                        <button
                                            type="button"
                                            onClick={handleDeselectAll}
                                            className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                                            disabled={submitting}
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600 mb-4">
                                    ✅ Selected: <strong>{formData.allowedRoutes.length}</strong> / {allNavItems.length} items
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                                    {allNavItems.map((item) => {
                                        const Icon = item.icon;
                                        const isSelected = formData.allowedRoutes.includes(item.path);

                                        return (
                                            <label
                                                key={item.path}
                                                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${isSelected
                                                        ? 'border-blue-500 bg-white shadow-sm'
                                                        : 'border-gray-200 bg-white hover:border-blue-300'
                                                    } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleRouteToggle(item.path)}
                                                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    disabled={submitting}
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Icon size={16} className={isSelected ? 'text-blue-600' : 'text-gray-600'} />
                                                        <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>



                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={18} />
                                            Create Admin
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Activity Modal */}
            {showActivityModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Admin Activity</h2>
                                <p className="text-sm text-gray-600 mt-1">{selectedAdmin?.fullName}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowActivityModal(false);
                                    setSelectedAdmin(null);
                                    setAdminActivity([]);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            {activityLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                </div>
                            ) : adminActivity.length === 0 ? (
                                <div className="text-center py-12">
                                    <Eye className="mx-auto text-gray-400 mb-4" size={48} />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No activity yet</h3>
                                    <p className="text-gray-600">Activity logs will appear here</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {adminActivity.map((activity, index) => (
                                        <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900">{activity.action}</p>
                                                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(activity.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;
