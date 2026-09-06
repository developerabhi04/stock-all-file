import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    RefreshControl,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import ApiService from '../../../services/ApiService';

const COLORS = {
    bg: '#000000',
    surface: '#141414',
    surface2: '#1A1A1A',
    border: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textMuted: '#6C6C6C',
    primary: '#00C896',
    primaryBg: '#0D2B24',
    warning: '#FF9800',
    warningBg: 'rgba(255, 152, 0, 0.15)',
    danger: '#FF5252',
    blue: '#2196F3',
    purple: '#9C27B0',
    skeletonBase: '#1F1F1F',
    skeletonHighlight: '#2B2B2B',
};

const ProfileWalletScreen = ({ navigation }) => {
    const [userData, setUserData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const pulseAnim = useRef(new Animated.Value(0.45)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 850,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.45,
                    duration: 850,
                    useNativeDriver: true,
                }),
            ])
        );

        loop.start();

        return () => {
            loop.stop();
        };
    }, [pulseAnim]);

    const skeletonAnimatedStyle = useMemo(() => {
        const opacity = pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.45, 1],
        });

        return { opacity };
    }, [pulseAnim]);

    useFocusEffect(
        useCallback(() => {
            fetchWalletData();
        }, [])
    );

    const fetchWalletData = async () => {
        try {
            console.log('💰 Fetching wallet data...');

            const profileResponse = await ApiService.getUserProfile();

            if (profileResponse.success) {
                setUserData(profileResponse.data);
                console.log('✅ Wallet Balance:', profileResponse.data.walletBalance);
            }

            const transactionsResponse = await ApiService.getTransactions(1, 6);

            if (transactionsResponse.success) {
                setTransactions(transactionsResponse.data || []);
                console.log('✅ Transactions fetched:', transactionsResponse.data?.length || 0);
            }
        } catch (error) {
            console.error('❌ Error fetching wallet data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchWalletData();
    };

    const getTransactionIcon = (transaction) => {
        const iconMap = {
            add_money: { icon: 'plus-circle', color: COLORS.primary },
            withdrawal: { icon: 'bank-transfer-out', color: COLORS.warning },
            dividend: { icon: 'gift', color: COLORS.purple },
            trade_buy: { icon: 'cart', color: COLORS.blue },
            trade_sell: { icon: 'cash-multiple', color: COLORS.primary },
            profit: { icon: 'trending-up', color: COLORS.primary },
            loss: { icon: 'trending-down', color: COLORS.danger },
            refund: { icon: 'refresh', color: COLORS.blue },
            default: { icon: 'swap-horizontal', color: COLORS.textSecondary },
        };

        return iconMap[transaction.category] || iconMap.default;
    };

    const getStatusColor = (status) => {
        const colors = {
            completed: COLORS.primary,
            pending: COLORS.warning,
            failed: COLORS.danger,
            rejected: COLORS.danger,
            cancelled: COLORS.textSecondary,
        };
        return colors[status] || COLORS.textSecondary;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const walletBalance = Number(userData?.walletBalance || 0);

    const SkeletonBlock = ({ width, height, radius = 10, style }) => (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius: radius,
                    backgroundColor: COLORS.skeletonBase,
                },
                skeletonAnimatedStyle,
                style,
            ]}
        />
    );

    const WalletSkeleton = () => (
        <View>
            <View style={styles.mainBalanceCard}>
                <View style={styles.balanceHeader}>
                    <SkeletonBlock width={28} height={28} radius={14} />
                    <SkeletonBlock width={116} height={14} radius={7} />
                </View>

                <SkeletonBlock width={190} height={38} radius={8} style={{ marginBottom: 14 }} />
                <SkeletonBlock width={128} height={28} radius={14} />
            </View>

            <View style={styles.transactionsSection}>
                <View style={styles.transactionsHeader}>
                    <SkeletonBlock width={142} height={16} radius={7} />
                    <SkeletonBlock width={60} height={12} radius={6} />
                </View>

                {[1, 2, 3, 4].map((item) => (
                    <View key={`txn-skeleton-${item}`} style={styles.transactionItem}>
                        <View style={styles.transactionLeft}>
                            <SkeletonBlock
                                width={40}
                                height={40}
                                radius={20}
                                style={styles.transactionIcon}
                            />
                            <View style={styles.transactionInfo}>
                                <View style={styles.transactionTopRow}>
                                    <SkeletonBlock width="58%" height={13} radius={6} />
                                    <SkeletonBlock width={50} height={20} radius={10} />
                                </View>

                                <View style={styles.transactionMeta}>
                                    <SkeletonBlock width={82} height={10} radius={5} />
                                    <SkeletonBlock width={8} height={8} radius={4} />
                                    <SkeletonBlock width={64} height={10} radius={5} />
                                </View>
                            </View>
                        </View>

                        <SkeletonBlock width={72} height={16} radius={6} style={{ marginLeft: 8 }} />
                    </View>
                ))}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

            <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-left" size={22} color={COLORS.text} />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Wallet</Text>

                    <TouchableOpacity
                        style={styles.historyButton}
                        onPress={() => navigation.navigate('TransactionHistory')}
                    >
                        <Icon name="history" size={20} color={COLORS.text} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
            >
                {loading ? (
                    <WalletSkeleton />
                ) : (
                    <>
                        <View style={styles.mainBalanceCard}>
                            <View style={styles.balanceHeader}>
                                <Icon name="wallet" size={24} color={COLORS.primary} />
                                <Text style={styles.balanceHeaderText}>Wallet Balance</Text>
                            </View>

                            <Text style={styles.mainBalanceValue}>
                                ₹
                                {walletBalance.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </Text>

                            <View style={styles.balanceTypeBadge}>
                                <Text style={styles.balanceTypeBadgeText}>
                                    Available Balance
                                </Text>
                            </View>
                        </View>

                        <View style={styles.transactionsSection}>
                            <View style={styles.transactionsHeader}>
                                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                                {transactions.length > 0 && (
                                    <TouchableOpacity
                                        onPress={() =>
                                            navigation.navigate('TransactionHistory')
                                        }
                                    >
                                        <Text style={styles.viewAllText}>View All</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {transactions.length > 0 ? (
                                transactions.map((transaction) => {
                                    const iconData = getTransactionIcon(transaction);
                                    const statusColor = getStatusColor(transaction.status);

                                    return (
                                        <View
                                            key={transaction._id || transaction.id}
                                            style={styles.transactionItem}
                                        >
                                            <View style={styles.transactionLeft}>
                                                <View
                                                    style={[
                                                        styles.transactionIcon,
                                                        {
                                                            backgroundColor:
                                                                iconData.color + '20',
                                                        },
                                                    ]}
                                                >
                                                    <Icon
                                                        name={iconData.icon}
                                                        size={18}
                                                        color={iconData.color}
                                                    />
                                                </View>

                                                <View style={styles.transactionInfo}>
                                                    <View style={styles.transactionTopRow}>
                                                        <Text
                                                            style={
                                                                styles.transactionDescription
                                                            }
                                                            numberOfLines={1}
                                                        >
                                                            {transaction.description}
                                                        </Text>

                                                        {transaction.status !== 'completed' && (
                                                            <View
                                                                style={[
                                                                    styles.statusBadge,
                                                                    {
                                                                        backgroundColor:
                                                                            statusColor + '20',
                                                                    },
                                                                ]}
                                                            >
                                                                <Text
                                                                    style={[
                                                                        styles.statusText,
                                                                        { color: statusColor },
                                                                    ]}
                                                                >
                                                                    {transaction.status}
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>

                                                    <View style={styles.transactionMeta}>
                                                        <Text style={styles.transactionDate}>
                                                            {formatDate(
                                                                transaction.createdAt
                                                            )}
                                                        </Text>
                                                        <Text style={styles.transactionDot}>
                                                            •
                                                        </Text>
                                                        <Text style={styles.transactionTime}>
                                                            {formatTime(
                                                                transaction.createdAt
                                                            )}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            <Text
                                                style={[
                                                    styles.transactionAmount,
                                                    {
                                                        color:
                                                            transaction.type === 'credit'
                                                                ? COLORS.primary
                                                                : COLORS.danger,
                                                    },
                                                ]}
                                            >
                                                {transaction.type === 'credit' ? '+' : '-'}₹
                                                {transaction.amount}
                                            </Text>
                                        </View>
                                    );
                                })
                            ) : (
                                <View style={styles.emptyState}>
                                    <Icon
                                        name="receipt-text-outline"
                                        size={42}
                                        color={COLORS.textMuted}
                                    />
                                    <Text style={styles.emptyStateText}>
                                        No transactions yet
                                    </Text>
                                    <Text style={styles.emptyStateSubtext}>
                                        Your recent wallet activity will appear here
                                    </Text>
                                </View>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>

            <SafeAreaView edges={['bottom']} style={styles.safeAreaBottom}>
                <View style={styles.bottomButtonsContainer}>
                    <TouchableOpacity
                        style={styles.withdrawButton}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('Withdraw')}
                    >
                        <Icon
                            name="bank-transfer-out"
                            size={18}
                            color={COLORS.text}
                        />
                        <Text style={styles.withdrawButtonText}>Withdraw</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.addMoneyButton}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('Recharge')}
                    >
                        <Icon name="plus-circle" size={18} color={COLORS.text} />
                        <Text style={styles.addMoneyButtonText}>Add Money</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },

    safeAreaTop: {
        backgroundColor: COLORS.bg,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: COLORS.bg,
        borderBottomWidth: 1,
        borderBottomColor: '#141414',
    },

    backButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
    },

    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: 0.2,
    },

    historyButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
    },

    scrollView: {
        flex: 1,
    },

    scrollContent: {
        paddingBottom: 24,
    },

    mainBalanceCard: {
        backgroundColor: COLORS.surface2,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 18,
        paddingHorizontal: 18,
        paddingVertical: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },

    balanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },

    balanceHeaderText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '700',
        letterSpacing: 0.2,
    },

    mainBalanceValue: {
        fontSize: 32,
        fontWeight: '900',
        color: COLORS.text,
        letterSpacing: -1.2,
        marginBottom: 12,
    },

    balanceTypeBadge: {
        backgroundColor: COLORS.primaryBg,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(0, 200, 150, 0.28)',
    },

    balanceTypeBadgeText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: '700',
    },

    transactionsSection: {
        marginHorizontal: 16,
    },

    transactionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },

    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.text,
    },

    viewAllText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '700',
    },

    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface2,
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },

    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    transactionInfo: {
        flex: 1,
    },

    transactionTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },

    transactionDescription: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
        flex: 1,
        marginRight: 8,
    },

    statusBadge: {
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 999,
    },

    statusText: {
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
    },

    transactionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    transactionDate: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },

    transactionTime: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },

    transactionDot: {
        fontSize: 11,
        color: COLORS.textMuted,
    },

    transactionAmount: {
        fontSize: 14,
        fontWeight: '800',
        marginLeft: 8,
    },

    emptyState: {
        alignItems: 'center',
        paddingVertical: 36,
        paddingHorizontal: 16,
    },

    emptyStateText: {
        fontSize: 15,
        color: COLORS.textSecondary,
        marginTop: 14,
        fontWeight: '700',
    },

    emptyStateSubtext: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 6,
        textAlign: 'center',
    },

    safeAreaBottom: {
        backgroundColor: COLORS.bg,
    },

    bottomButtonsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 12,
        gap: 12,
        backgroundColor: COLORS.bg,
        borderTopWidth: 1,
        borderTopColor: '#141414',
    },

    withdrawButton: {
        flex: 1,
        backgroundColor: '#2B1D08',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.warning,
        gap: 8,
    },

    withdrawButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.warning,
        letterSpacing: 0.2,
    },

    addMoneyButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },

    addMoneyButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: 0.2,
    },
});

export default ProfileWalletScreen;