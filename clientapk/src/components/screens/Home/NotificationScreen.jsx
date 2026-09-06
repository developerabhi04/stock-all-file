import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../../../services/ApiService';

const NotificationScreen = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const result = await ApiService.getUserNotifications();
            if (result?.success && Array.isArray(result.data?.notifications)) {
                const list = result.data.notifications.map((n) => ({
                    id: n._id,
                    type: n.type || 'system',
                    icon: getIconForType(n.type),
                    iconColor: getIconColorForType(n.type),
                    iconBg: getIconBgForType(n.type),
                    title: n.title || 'Notification',
                    message: n.message || '',
                    time: formatTime(n.createdAt),
                    isRead: !!n.isRead,
                }));
                setNotifications(list);
            } else {
                setNotifications([]);
            }
        } catch (error) {
            console.error('❌ Error fetching notifications:', error?.message || error);
            setNotifications([]);
        } finally {
            if (isRefresh) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        loadNotifications(false);
    }, [loadNotifications]);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const markAsRead = (id) => {
        setNotifications((prev) =>
            prev.map((notif) =>
                notif.id === id ? { ...notif, isRead: true } : notif
            )
        );
    };

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
    };

    const renderNotification = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.notificationCard,
                !item.isRead && styles.notificationCardUnread,
            ]}
            activeOpacity={0.7}
            onPress={() => markAsRead(item.id)}
        >
            <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                <Icon name={item.icon} size={24} color={item.iconColor} />
            </View>

            <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle} numberOfLines={1}>
                        {item.title}
                    </Text>
                    {!item.isRead && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.notificationMessage} numberOfLines={2}>
                    {item.message}
                </Text>

                <View style={styles.notificationFooter}>
                    <Icon name="clock-outline" size={12} color="#666666" />
                    <Text style={styles.notificationTime}>{item.time}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Update unread count for HomeScreen badge when this screen is focused
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            navigation.setParams({ unreadCount });
        });
        return unsubscribe;
    }, [navigation, unreadCount]);

    const handleRefresh = () => {
        loadNotifications(true);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            <SafeAreaView edges={['top']} style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Icon name="arrow-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Notifications</Text>
                        {unreadCount > 0 && (
                            <View style={styles.headerBadge}>
                                <Text style={styles.headerBadgeText}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.markAllButton}
                        onPress={markAllAsRead}
                        activeOpacity={0.7}
                    >
                        <Icon name="check-all" size={22} color="#00C896" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Notifications List */}
            {loading && !refreshing ? (
                <View style={styles.loadingState}>
                    <ActivityIndicator size="small" color="#00C896" />
                    <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
            ) : notifications.length > 0 ? (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#00C896"
                        />
                    }
                />
            ) : (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <Icon name="bell-off-outline" size={60} color="#666666" />
                    </View>
                    <Text style={styles.emptyStateTitle}>No Notifications</Text>
                    <Text style={styles.emptyStateText}>
                        You're all caught up. Pull down to refresh or check back later for updates.
                    </Text>
                </View>
            )}
        </View>
    );
};

// Helpers: type → icon/colors
const getIconForType = (type) => {
    switch (type) {
        case 'payment':
        case 'transaction':
            return 'cash';
        case 'withdrawal':
            return 'cash-minus';
        case 'trade':
            return 'chart-line';
        case 'alert':
            return 'alert-circle';
        case 'promotion':
            return 'gift-outline';
        default:
            return 'information';
    }
};

const getIconColorForType = (type) => {
    switch (type) {
        case 'payment':
        case 'transaction':
        case 'withdrawal':
            return '#00C896';
        case 'trade':
            return '#2196F3';
        case 'alert':
            return '#FF9800';
        case 'promotion':
            return '#FF5252';
        default:
            return '#9C27B0';
    }
};

const getIconBgForType = (type) => {
    switch (type) {
        case 'payment':
        case 'transaction':
        case 'withdrawal':
            return '#0D2B24';
        case 'trade':
            return '#1A1F2A';
        case 'alert':
            return '#2A1F0D';
        case 'promotion':
            return '#2A1F1F';
        default:
            return '#1F1A2A';
    }
};

const formatTime = (createdAt) => {
    if (!createdAt) return '';
    try {
        const date = new Date(createdAt);
        return date.toLocaleString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: 'short',
        });
    } catch {
        return '';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    safeArea: {
        backgroundColor: '#000000',
    },
    header: {
        backgroundColor: '#000000',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    headerBadge: {
        backgroundColor: '#FF5252',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    markAllButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    notificationCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    notificationCardUnread: {
        backgroundColor: '#0D2B24',
        borderColor: '#00C896',
        borderWidth: 1.5,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    notificationTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00C896',
        marginLeft: 8,
    },
    notificationMessage: {
        fontSize: 13,
        color: '#999999',
        lineHeight: 18,
        marginBottom: 8,
    },
    notificationFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    notificationTime: {
        fontSize: 11,
        color: '#666666',
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#2A2A2A',
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#999999',
        textAlign: 'center',
        lineHeight: 20,
    },
    loadingState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 8,
        fontSize: 13,
        color: '#999999',
    },
});

export default NotificationScreen;