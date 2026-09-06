import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/colors';
import { COMMON_STYLES, TYPOGRAPHY } from '../../../constants/styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Mock Transaction Data
const TRANSACTION_DATA = [
    {
        id: 'txn-1',
        type: 'recharge',
        amount: '5000',
        status: 'success',
        date: '2025-10-07',
        time: '10:30 AM',
        transactionId: 'TXN1234567890',
        method: 'UPI',
    },
    {
        id: 'txn-2',
        type: 'withdraw',
        amount: '2000',
        status: 'success',
        date: '2025-10-06',
        time: '03:45 PM',
        transactionId: 'TXN0987654321',
        method: 'Bank Transfer',
    },
    {
        id: 'txn-3',
        type: 'recharge',
        amount: '10000',
        status: 'success',
        date: '2025-10-05',
        time: '09:15 AM',
        transactionId: 'TXN1122334455',
        method: 'Credit Card',
    },
    {
        id: 'txn-4',
        type: 'withdraw',
        amount: '3500',
        status: 'pending',
        date: '2025-10-04',
        time: '02:20 PM',
        transactionId: 'TXN5544332211',
        method: 'Bank Transfer',
    },
    {
        id: 'txn-5',
        type: 'recharge',
        amount: '7500',
        status: 'success',
        date: '2025-10-03',
        time: '11:00 AM',
        transactionId: 'TXN6677889900',
        method: 'Debit Card',
    },
    {
        id: 'txn-6',
        type: 'withdraw',
        amount: '1500',
        status: 'failed',
        date: '2025-10-02',
        time: '04:30 PM',
        transactionId: 'TXN9988776655',
        method: 'Bank Transfer',
    },
    {
        id: 'txn-7',
        type: 'recharge',
        amount: '3000',
        status: 'success',
        date: '2025-10-01',
        time: '08:45 AM',
        transactionId: 'TXN1357924680',
        method: 'UPI',
    },
    {
        id: 'txn-8',
        type: 'withdraw',
        amount: '5000',
        status: 'success',
        date: '2025-09-30',
        time: '01:15 PM',
        transactionId: 'TXN2468013579',
        method: 'Bank Transfer',
    },
];

const TABS = ['All', 'Recharge', 'Withdraw'];

const HistoryScreen = ({ navigation }) => {
    const [selectedTab, setSelectedTab] = useState('All');

    const getFilteredTransactions = () => {
        if (selectedTab === 'All') return TRANSACTION_DATA;
        return TRANSACTION_DATA.filter(
            txn => txn.type === selectedTab.toLowerCase(),
        );
    };

    const getStatusColor = status => {
        switch (status) {
            case 'success':
                return COLORS.success;
            case 'pending':
                return COLORS.warning;
            case 'failed':
                return COLORS.error;
            default:
                return COLORS.textSecondary;
        }
    };

    const getStatusIcon = status => {
        switch (status) {
            case 'success':
                return 'check-circle';
            case 'pending':
                return 'clock-outline';
            case 'failed':
                return 'close-circle';
            default:
                return 'information';
        }
    };

    const renderTransactionItem = ({ item }) => (
        <TouchableOpacity
            style={styles.transactionCard}
            activeOpacity={0.8}
            onPress={() =>
                navigation.navigate('TransactionDetail', { transaction: item })
            }>
            <View style={styles.cardLeft}>
                <View
                    style={[
                        styles.transactionIcon,
                        {
                            backgroundColor:
                                item.type === 'recharge'
                                    ? COLORS.successLight
                                    : COLORS.warningLight,
                        },
                    ]}>
                    <Icon
                        name={item.type === 'recharge' ? 'arrow-down' : 'arrow-up'}
                        size={24}
                        color={item.type === 'recharge' ? COLORS.success : COLORS.warning}
                    />
                </View>

                <View style={styles.transactionInfo}>
                    <Text style={styles.transactionType}>
                        {item.type === 'recharge' ? 'Recharge' : 'Withdraw'}
                    </Text>
                    <Text style={styles.transactionDate}>
                        {item.date} • {item.time}
                    </Text>
                    <Text style={styles.transactionMethod}>{item.method}</Text>
                </View>
            </View>

            <View style={styles.cardRight}>
                <Text
                    style={[
                        styles.transactionAmount,
                        { color: item.type === 'recharge' ? COLORS.success : COLORS.error },
                    ]}>
                    {item.type === 'recharge' ? '+' : '-'}₹{item.amount}
                </Text>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status) + '20' },
                    ]}>
                    <Icon
                        name={getStatusIcon(item.status)}
                        size={14}
                        color={getStatusColor(item.status)}
                    />
                    <Text
                        style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (

        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor={COLORS.primary}
                translucent={false}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transaction History</Text>
                <TouchableOpacity style={styles.filterButton}>
                    <Icon name="filter-variant" size={24} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            {/* Summary Cards */}
            {/* <View style={styles.summaryContainer}>
                <View style={styles.summaryCard}>
                    <Icon name="wallet-plus" size={28} color={COLORS.success} />
                    <Text style={styles.summaryLabel}>Total Recharged</Text>
                    <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                        ₹25,500
                    </Text>
                </View>

                <View style={styles.summaryCard}>
                    <Icon name="wallet-minus" size={28} color={COLORS.error} />
                    <Text style={styles.summaryLabel}>Total Withdrawn</Text>
                    <Text style={[styles.summaryValue, { color: COLORS.error }]}>
                        ₹12,000
                    </Text>
                </View>
            </View> */}

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {TABS.map((tab, index) => (
                    <TouchableOpacity
                        key={`tab-${index}`}
                        style={[styles.tab, selectedTab === tab && styles.tabActive]}
                        onPress={() => setSelectedTab(tab)}>
                        <Text
                            style={[
                                styles.tabText,
                                selectedTab === tab && styles.tabTextActive,
                            ]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Transaction List */}
            {getFilteredTransactions().length > 0 ? (
                <FlatList
                    data={getFilteredTransactions()}
                    renderItem={renderTransactionItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Icon name="file-document-outline" size={80} color={COLORS.textTertiary} />
                    <Text style={styles.emptyStateTitle}>No Transactions</Text>
                    <Text style={styles.emptyStateSubtitle}>
                        You haven't made any {selectedTab.toLowerCase()} transactions yet
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
    },

    header: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTitle: {
        ...TYPOGRAPHY.h4,
        color: COLORS.white,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },

    filterButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Summary
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 20,
        gap: 12,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    summaryCard: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...COMMON_STYLES.shadow,
    },

    summaryLabel: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginTop: 8,
        marginBottom: 4,
        textAlign: 'center',
    },

    summaryValue: {
        ...TYPOGRAPHY.h4,
        fontWeight: '800',
    },

    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 10,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    tabActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },

    tabText: {
        ...TYPOGRAPHY.body2Medium,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },

    tabTextActive: {
        color: COLORS.white,
    },

    // Transaction List
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
    },

    transactionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...COMMON_STYLES.shadow,
    },

    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    transactionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    transactionInfo: {
        flex: 1,
    },

    transactionType: {
        ...TYPOGRAPHY.body1,
        fontWeight: '700',
        marginBottom: 4,
    },

    transactionDate: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },

    transactionMethod: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textTertiary,
        fontSize: 11,
    },

    cardRight: {
        alignItems: 'flex-end',
    },

    transactionAmount: {
        ...TYPOGRAPHY.h5,
        fontWeight: '800',
        marginBottom: 6,
    },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },

    statusText: {
        ...TYPOGRAPHY.caption,
        fontWeight: '700',
        fontSize: 11,
    },

    // Empty State
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },

    emptyStateTitle: {
        ...TYPOGRAPHY.h3,
        marginTop: 20,
        marginBottom: 8,
    },

    emptyStateSubtitle: {
        ...TYPOGRAPHY.body2,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});

export default HistoryScreen;
