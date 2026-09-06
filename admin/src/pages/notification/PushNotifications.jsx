import { useState, useEffect } from 'react';
import { Send, Users, User, Bell, Clock, CheckCircle, Loader } from 'lucide-react';
import { adminAPI } from '../../services/api';
import PageHeader from '../paymentmanager/PageHeader';

const PushNotifications = () => {
    const [activeTab, setActiveTab] = useState('send'); // 'send' or 'history'
    const [sendType, setSendType] = useState('all'); // 'all' or 'individual'
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'general', // general, payment, withdrawal, promotion
    });

    // Fetch users for individual notification
    useEffect(() => {
        if (sendType === 'individual') {
            fetchUsers();
        }
    }, [sendType]);

    // Fetch notification history when tab changes
    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getUsersForNotification();
            setUsers(response.data.data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            setHistoryLoading(true);
            const response = await adminAPI.getNotificationHistory();
            setHistory(response.data.data.notifications || []);
        } catch (error) {
            console.error('Error fetching notification history:', error);
            // If API not implemented yet, show empty
            setHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSendNotification = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.title.trim() || !formData.message.trim()) {
            alert('Please fill in all fields');
            return;
        }

        if (sendType === 'individual' && !selectedUser) {
            alert('Please select a user');
            return;
        }

        try {
            setSending(true);

            const notificationData = {
                title: formData.title,
                message: formData.message,
                type: formData.type
            };

            if (sendType === 'all') {
                await adminAPI.sendNotificationToAll(notificationData);
                alert('✅ Notification sent to all users successfully!');
            } else {
                await adminAPI.sendNotificationToUser(selectedUser, notificationData);
                alert('✅ Notification sent successfully!');
            }

            // Reset form
            setFormData({
                title: '',
                message: '',
                type: 'general'
            });
            setSelectedUser('');

            // Refresh history
            if (activeTab === 'history') {
                fetchHistory();
            }
        } catch (error) {
            console.error('Error sending notification:', error);
            alert(error.response?.data?.message || 'Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'payment':
                return 'bg-green-100 text-green-700';
            case 'withdrawal':
                return 'bg-blue-100 text-blue-700';
            case 'promotion':
                return 'bg-purple-100 text-purple-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'payment':
                return '💰';
            case 'withdrawal':
                return '💸';
            case 'promotion':
                return '🎁';
            default:
                return '📢';
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Push Notifications"
                subtitle="Send push notifications to users"
            />

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('send')}
                            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${activeTab === 'send'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <Send size={20} />
                            Send Notification
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${activeTab === 'history'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <Clock size={20} />
                            History
                        </button>
                    </div>
                </div>

                {/* Send Tab */}
                {activeTab === 'send' && (
                    <div className="p-6">
                        {/* Send Type Selection */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={() => setSendType('all')}
                                className={`p-6 rounded-lg border-2 transition ${sendType === 'all'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Users className="mx-auto mb-3 text-blue-600" size={32} />
                                <h3 className="font-semibold text-gray-900 mb-1">Send to All Users</h3>
                                <p className="text-sm text-gray-600">Broadcast to all registered users</p>
                            </button>

                            <button
                                onClick={() => setSendType('individual')}
                                className={`p-6 rounded-lg border-2 transition ${sendType === 'individual'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <User className="mx-auto mb-3 text-purple-600" size={32} />
                                <h3 className="font-semibold text-gray-900 mb-1">Send to Individual</h3>
                                <p className="text-sm text-gray-600">Send to specific user</p>
                            </button>
                        </div>

                        {/* Notification Form */}
                        <form onSubmit={handleSendNotification} className="space-y-4">
                            {/* User Selection (Only for individual) */}
                            {sendType === 'individual' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select User
                                    </label>
                                    {loading ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader className="animate-spin text-blue-500" size={24} />
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedUser}
                                            onChange={(e) => setSelectedUser(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        >
                                            <option value="">-- Select a user --</option>
                                            {users.map((user) => (
                                                <option key={user._id} value={user._id}>
                                                    {user.fullName} ({user.phoneNumber}) — Wallet: ₹{user.walletBalance?.toFixed(2) || '0.00'} | Joined: {new Date(user.createdAt).toLocaleDateString('en-IN')}
                                                </option>
                                            ))}

                                        </select>
                                    )}
                                </div>
                            )}

                            {/* Notification Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notification Type
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="general">📢 General</option>
                                    <option value="payment">💰 Payment</option>
                                    <option value="withdrawal">💸 Withdrawal</option>
                                    <option value="promotion">🎁 Promotion</option>
                                </select>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notification Title
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Enter notification title"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    maxLength={50}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    {formData.title.length}/50 characters
                                </p>
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message
                                </label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    placeholder="Enter notification message"
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    required
                                    maxLength={200}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    {formData.message.length}/200 characters
                                </p>
                            </div>

                            {/* Preview */}
                            {(formData.title || formData.message) && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <Bell className="text-blue-600" size={20} />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-gray-900">
                                                        {formData.title || 'Notification Title'}
                                                    </h4>
                                                    <span className="text-lg">{getTypeIcon(formData.type)}</span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    {formData.message || 'Notification message will appear here'}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">Just now</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData({ title: '', message: '', type: 'general' });
                                        setSelectedUser('');
                                    }}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Clear
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {sending ? (
                                        <>
                                            <Loader className="animate-spin" size={20} />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            Send Notification
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="p-6">
                        {historyLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader className="animate-spin text-blue-500" size={32} />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-12">
                                <Clock className="mx-auto text-gray-400 mb-4" size={48} />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications sent yet</h3>
                                <p className="text-gray-600">Your notification history will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {history.map((notification, index) => (
                                    <div
                                        key={index}
                                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(notification.type)}`}>
                                                {notification.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Users size={14} />
                                                {notification.recipients === 'all' ? 'All Users' : '1 User'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <CheckCircle size={14} className="text-green-500" />
                                                Sent
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PushNotifications;
