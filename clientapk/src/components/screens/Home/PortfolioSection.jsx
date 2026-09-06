import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SUCCESS = '#00C896';
const WARNING = '#FFB020';
const ERROR = '#FF5252';

const formatCurrency = (value = 0) => {
    const num = Number(value || 0);
    return num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const formatCompactDate = (value) => {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const getOrderStatusTone = (status) => {
    const normalized = String(status || '').toLowerCase();

    if (normalized === 'approved') {
        return {
            bg: 'rgba(0, 200, 150, 0.14)',
            color: SUCCESS,
            label: 'Approved',
        };
    }

    if (normalized === 'rejected') {
        return {
            bg: 'rgba(255, 82, 82, 0.14)',
            color: ERROR,
            label: 'Rejected',
        };
    }

    if (normalized === 'cancelled') {
        return {
            bg: 'rgba(255, 176, 32, 0.14)',
            color: WARNING,
            label: 'Cancelled',
        };
    }

    return {
        bg: 'rgba(255, 176, 32, 0.14)',
        color: WARNING,
        label: 'Pending',
    };
};

const PortfolioSection = ({
    theme,
    selectedTab,
    setSelectedTab,
    investments = [],
    orders = [],
    totalInvested = 0,
    totalInterestEarned = 0,
    totalActive = 0,
    navigation,
}) => {
    const renderInvestmentItem = (item) => {
        const isLocked = item?.isLocked ?? item?.lockStatus === 'locked' ?? true;
        const canCancel = item?.canCancel ?? !isLocked;
        const progressPercent = Number(item?.progressPercent || 0);
        const lockToneBg = isLocked ? 'rgba(255, 176, 32, 0.14)' : 'rgba(0, 200, 150, 0.14)';
        const lockToneColor = isLocked ? WARNING : SUCCESS;

        return (
            <TouchableOpacity
                key={item.id}
                style={[
                    styles.investmentCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('InvestmentDetails', { investmentId: item.id })}
            >
                <View style={styles.investmentHeader}>
                    <View style={styles.investmentLeft}>
                        <Text style={[styles.investmentName, { color: theme.text }]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={[styles.investmentTicker, { color: theme.textSecondary }]}>
                            {item.symbol || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.investmentRight}>
                        <Text style={[styles.investmentAmount, { color: theme.text }]}>
                            ₹{formatCurrency(item.investedAmount)}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: lockToneBg }]}>
                            <Text style={[styles.statusBadgeText, { color: lockToneColor }]}>
                                {isLocked ? 'Locked' : 'Unlocked'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                    <View
                        style={[
                            styles.progressFill,
                            {
                                width: `${Math.min(Math.max(progressPercent, 0), 100)}%`,
                                backgroundColor: SUCCESS,
                            },
                        ]}
                    />
                </View>

                <View style={styles.metaGrid}>
                    <View style={styles.metaItem}>
                        <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Daily Earning</Text>
                        <Text style={[styles.metaValue, { color: SUCCESS }]}>
                            ₹{formatCurrency(item.dailyInterestAmount)}
                        </Text>
                    </View>

                    <View style={styles.metaItem}>
                        <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Daily Rate</Text>
                        <Text style={[styles.metaValue, { color: theme.text }]}>
                            {Number(item.dailyRate || 0)}%
                        </Text>
                    </View>

                    <View style={styles.metaItem}>
                        <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Days Running</Text>
                        <Text style={[styles.metaValue, { color: theme.text }]}>
                            {Number(item.daysCompleted || 0)} / 30
                        </Text>
                    </View>

                    <View style={styles.metaItem}>
                        <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Days Remaining</Text>
                        <Text style={[styles.metaValue, { color: theme.text }]}>
                            {Number(item.daysRemaining || 0)}
                        </Text>
                    </View>

                    <View style={styles.metaItem}>
                        <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Total Earned</Text>
                        <Text style={[styles.metaValue, { color: SUCCESS }]}>
                            ₹{formatCurrency(item.totalInterestEarned)}
                        </Text>
                    </View>

                    <View style={styles.metaItem}>
                        <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Cancel Access</Text>
                        <Text style={[styles.metaValue, { color: canCancel ? SUCCESS : WARNING }]}>
                            {canCancel ? 'Available' : 'After unlock'}
                        </Text>
                    </View>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                        {isLocked
                            ? 'After 30 days it will open, then you can cancel/sell'
                            : 'This investment is now unlocked for cancel/sell'}
                    </Text>

                    <TouchableOpacity
                        style={[
                            styles.footerAction,
                            {
                                backgroundColor: canCancel ? 'rgba(0, 200, 150, 0.14)' : theme.border,
                            },
                        ]}
                        disabled={!canCancel}
                        onPress={() => navigation.navigate('InvestmentDetails', { investmentId: item.id })}
                    >
                        <Text
                            style={[
                                styles.footerActionText,
                                { color: canCancel ? SUCCESS : theme.textSecondary },
                            ]}
                        >
                            {canCancel ? 'Manage' : 'Locked'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderOrderItem = (item) => {
        const tone = getOrderStatusTone(item.status);

        return (
            <TouchableOpacity
                key={item.id}
                style={[
                    styles.orderCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Orders')}
            >
                <View style={styles.orderHeader}>
                    <View style={styles.orderLeft}>
                        <View style={styles.orderTopRow}>
                            <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
                                <Text style={[styles.statusBadgeText, { color: tone.color }]}>
                                    {tone.label}
                                </Text>
                            </View>
                        </View>

                        <Text style={[styles.orderName, { color: theme.text }]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={[styles.orderTicker, { color: theme.textSecondary }]}>
                            {item.symbol || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.orderRight}>
                        <Text style={[styles.orderAmount, { color: theme.text }]}>
                            ₹{formatCurrency(item.amount)}
                        </Text>
                        <Text style={[styles.orderRate, { color: SUCCESS }]}>
                            {Number(item.dailyRate || 0)}% / day
                        </Text>
                    </View>
                </View>

                <View style={styles.orderInfoRow}>
                    <View style={styles.orderInfoItem}>
                        <Text style={[styles.orderInfoLabel, { color: theme.textSecondary }]}>Daily Earning</Text>
                        <Text style={[styles.orderInfoValue, { color: SUCCESS }]}>
                            ₹{formatCurrency(item.dailyInterestAmount)}
                        </Text>
                    </View>

                    <View style={styles.orderInfoItem}>
                        <Text style={[styles.orderInfoLabel, { color: theme.textSecondary }]}>Order Date</Text>
                        <Text style={[styles.orderInfoValue, { color: theme.text }]}>
                            {formatCompactDate(item.createdAt)}
                        </Text>
                    </View>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                        {String(item.status || '').toLowerCase() === 'pending'
                            ? 'Waiting for admin approval'
                            : `Order status: ${tone.label}`}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.portfolioSection}>
            <View
                style={[
                    styles.portfolioSummary,
                    { backgroundColor: theme.card, borderColor: theme.border },
                ]}
            >
                <View style={styles.portfolioSummaryBox}>
                    <Text style={[styles.portfolioLabel, { color: theme.textSecondary }]}>
                        Active Investments
                    </Text>
                    <Text style={[styles.portfolioValue, { color: theme.text }]}>
                        {totalActive}
                    </Text>
                </View>

                <View style={styles.portfolioSummaryBox}>
                    <Text style={[styles.portfolioLabel, { color: theme.textSecondary }]}>
                        Total Invested
                    </Text>
                    <Text style={[styles.portfolioValue, { color: theme.text }]}>
                        ₹{formatCurrency(totalInvested)}
                    </Text>
                </View>

                <View style={styles.portfolioSummaryBox}>
                    <Text style={[styles.portfolioLabel, { color: theme.textSecondary }]}>
                        Interest Earned
                    </Text>
                    <Text style={[styles.portfolioValue, { color: SUCCESS }]}>
                        ₹{formatCurrency(totalInterestEarned)}
                    </Text>
                </View>
            </View>

            <View
                style={[
                    styles.tabSelector,
                    { backgroundColor: theme.card, borderColor: theme.border },
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.tab,
                        selectedTab === 'investments' && {
                            backgroundColor: 'rgba(0, 200, 150, 0.14)',
                            borderColor: SUCCESS,
                            borderWidth: 1,
                        },
                    ]}
                    onPress={() => setSelectedTab('investments')}
                >
                    <Icon
                        name="briefcase-outline"
                        size={16}
                        color={selectedTab === 'investments' ? SUCCESS : theme.textSecondary}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            {
                                color:
                                    selectedTab === 'investments'
                                        ? SUCCESS
                                        : theme.textSecondary,
                            },
                        ]}
                    >
                        Investments ({investments.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tab,
                        selectedTab === 'orders' && {
                            backgroundColor: 'rgba(0, 200, 150, 0.14)',
                            borderColor: SUCCESS,
                            borderWidth: 1,
                        },
                    ]}
                    onPress={() => setSelectedTab('orders')}
                >
                    <Icon
                        name="clipboard-text-outline"
                        size={16}
                        color={selectedTab === 'orders' ? SUCCESS : theme.textSecondary}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            {
                                color:
                                    selectedTab === 'orders'
                                        ? SUCCESS
                                        : theme.textSecondary,
                            },
                        ]}
                    >
                        Orders ({orders.length})
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.portfolioContent}>
                {selectedTab === 'investments' ? (
                    <>
                        {investments.length > 0 ? (
                            investments.map(renderInvestmentItem)
                        ) : (
                            <View
                                style={[
                                    styles.emptyCard,
                                    { backgroundColor: theme.card, borderColor: theme.border },
                                ]}
                            >
                                <Icon name="briefcase-outline" size={28} color={theme.textSecondary} />
                                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                                    No active investments
                                </Text>
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                    Approved investments will appear here with lock timer and earnings.
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.viewAllButton,
                                { backgroundColor: theme.card, borderColor: theme.border },
                            ]}
                            onPress={() => navigation.navigate('Portfolio')}
                        >
                            <Text style={styles.viewAllText}>View All Investments</Text>
                            <Icon name="arrow-right" size={16} color={SUCCESS} />
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        {orders.length > 0 ? (
                            orders.map(renderOrderItem)
                        ) : (
                            <View
                                style={[
                                    styles.emptyCard,
                                    { backgroundColor: theme.card, borderColor: theme.border },
                                ]}
                            >
                                <Icon name="clipboard-text-outline" size={28} color={theme.textSecondary} />
                                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                                    No recent orders
                                </Text>
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                    Pending, approved, and rejected investment orders will appear here.
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.viewAllButton,
                                { backgroundColor: theme.card, borderColor: theme.border },
                            ]}
                            onPress={() => navigation.navigate('Orders')}
                        >
                            <Text style={styles.viewAllText}>View All Orders</Text>
                            <Icon name="arrow-right" size={16} color={SUCCESS} />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    portfolioSection: {
        marginHorizontal: 16,
        marginBottom: 20,
    },
    portfolioSummary: {
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        gap: 12,
    },
    portfolioSummaryBox: {
        marginBottom: 2,
    },
    portfolioLabel: {
        fontSize: 11,
        marginBottom: 4,
        fontWeight: '600',
    },
    portfolioValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    tabSelector: {
        flexDirection: 'row',
        borderRadius: 10,
        padding: 3,
        marginBottom: 12,
        borderWidth: 1,
        gap: 3,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 4,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
    },
    portfolioContent: {},
    investmentCard: {
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
    },
    investmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    investmentLeft: {
        flex: 1,
        paddingRight: 12,
    },
    investmentRight: {
        alignItems: 'flex-end',
    },
    investmentName: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 4,
    },
    investmentTicker: {
        fontSize: 11,
        fontWeight: '500',
    },
    investmentAmount: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 6,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    progressTrack: {
        height: 8,
        borderRadius: 999,
        overflow: 'hidden',
        marginBottom: 14,
    },
    progressFill: {
        height: '100%',
        borderRadius: 999,
    },
    metaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 14,
    },
    metaItem: {
        width: '48%',
    },
    metaLabel: {
        fontSize: 11,
        marginBottom: 4,
        fontWeight: '500',
    },
    metaValue: {
        fontSize: 13,
        fontWeight: '800',
    },
    cardFooter: {
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    footerText: {
        flex: 1,
        fontSize: 11,
        lineHeight: 16,
    },
    footerAction: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    footerActionText: {
        fontSize: 12,
        fontWeight: '800',
    },
    orderCard: {
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderLeft: {
        flex: 1,
        paddingRight: 12,
    },
    orderTopRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    orderName: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 4,
    },
    orderTicker: {
        fontSize: 11,
        fontWeight: '500',
    },
    orderRight: {
        alignItems: 'flex-end',
    },
    orderAmount: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 4,
    },
    orderRate: {
        fontSize: 12,
        fontWeight: '700',
    },
    orderInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    orderInfoItem: {
        flex: 1,
    },
    orderInfoLabel: {
        fontSize: 11,
        marginBottom: 4,
        fontWeight: '500',
    },
    orderInfoValue: {
        fontSize: 13,
        fontWeight: '800',
    },
    emptyCard: {
        borderRadius: 14,
        borderWidth: 1,
        paddingVertical: 24,
        paddingHorizontal: 18,
        alignItems: 'center',
        marginBottom: 12,
    },
    emptyTitle: {
        marginTop: 10,
        marginBottom: 6,
        fontSize: 15,
        fontWeight: '800',
    },
    emptyText: {
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 6,
        gap: 4,
        borderWidth: 1,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: SUCCESS,
    },
});

export default PortfolioSection;