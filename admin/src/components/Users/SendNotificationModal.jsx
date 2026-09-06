import { useState } from 'react';
import { Send, X, Loader, Bell } from 'lucide-react';
import { adminAPI } from '../../services/api';

const SendNotificationModal = ({ userId, onClose }) => {
    const [sendingNotification, setSendingNotification] = useState(false);
    const [notificationData, setNotificationData] = useState({
        title: '',
        message: '',
        type: 'general'
    });

    const handleSendNotification = async (e) => {
        e.preventDefault();

        if (!notificationData.title.trim() || !notificationData.message.trim()) {
            alert('Please fill in all fields');
            return;
        }

        try {
            setSendingNotification(true);
            await adminAPI.sendNotificationToUser(userId, notificationData);

            alert('✅ Notification sent successfully!');
            onClose();
        } catch (error) {
            console.error('Error sending notification:', error);
            alert(error.response?.data?.message || 'Failed to send notification');
        } finally {
            setSendingNotification(false);
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
            case 'order':
                return '📦';
            default:
                return '📢';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Send className="text-purple-600" size={24} />
                        Send Notification
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSendNotification} className="p-6 space-y-4">
                    {/* Notification Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notification Type</label>
                        <select
                            value={notificationData.type}
                            onChange={(e) => setNotificationData(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition"
                        >
                            <option value="general">📢 General</option>
                            <option value="payment">💰 Payment</option>
                            <option value="withdrawal">💸 Withdrawal</option>
                            <option value="order">📦 Order Update</option>
                            <option value="promotion">🎁 Promotion</option>
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input
                            type="text"
                            value={notificationData.title}
                            onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition"
                            placeholder="Enter notification title"
                            maxLength={50}
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            {notificationData.title.length}/50 characters
                        </p>
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                        <textarea
                            value={notificationData.message}
                            onChange={(e) => setNotificationData(prev => ({ ...prev, message: e.target.value }))}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition resize-none"
                            rows="4"
                            placeholder="Enter notification message"
                            maxLength={200}
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            {notificationData.message.length}/200 characters
                        </p>
                    </div>

                    {/* Preview */}
                    {(notificationData.title || notificationData.message) && (
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-4">
                            <p className="text-sm font-medium text-purple-700 mb-3">Preview:</p>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Bell className="text-purple-600" size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-gray-900">
                                                {notificationData.title || 'Notification Title'}
                                            </h4>
                                            <span className="text-lg">{getTypeIcon(notificationData.type)}</span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {notificationData.message || 'Notification message will appear here'}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">Just now</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl transition font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={sendingNotification}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                        >
                            {sendingNotification ? (
                                <>
                                    <Loader className="animate-spin" size={18} />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Send Now
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default SendNotificationModal;
