import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    TextInput,
    FlatList,
    RefreshControl,
    Animated,
    useWindowDimensions,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import ApiService from '../../../services/ApiService';

const COLORS = {
    bg: '#000000',
    card: '#171717',
    card2: '#111111',
    border: '#292929',
    borderSoft: '#222222',
    text: '#FFFFFF',
    textMuted: '#A1A1AA',
    textDim: '#666666',
    textSoft: '#8A8A93',
    primary: '#00C896',
    primarySoft: 'rgba(0, 200, 150, 0.10)',
    primarySoft2: 'rgba(0, 200, 150, 0.06)',
    danger: '#FF5252',
    warning: '#FF9800',
    info: '#2196F3',
    purple: '#9C27B0',
    gold: '#FFD700',
    skeletonBase: '#1D1D21',
    skeletonHighlight: 'rgba(255,255,255,0.08)',
    overlay: 'rgba(0,0,0,0.72)',
};

const FILTER_OPTIONS = [
    { id: 'all', label: 'All', icon: 'view-grid' },
    { id: 'credit', label: 'Credit', icon: 'plus-circle' },
    { id: 'debit', label: 'Debit', icon: 'minus-circle' },
    { id: 'withdrawal', label: 'Withdrawal', icon: 'bank-transfer-out' },
    { id: 'pending', label: 'Pending', icon: 'clock-outline' },
];

const CATEGORY_META = {
    add_money: { label: 'Added Money', icon: 'plus-circle', color: '#00C896' },
    withdrawal: { label: 'Withdrawal', icon: 'bank-transfer-out', color: '#FF9800' },
    trade_buy: { label: 'Buy Order', icon: 'cart', color: '#2196F3' },
    trade_sell: { label: 'Sell Order', icon: 'cash-multiple', color: '#00C896' },
    profit: { label: 'Profit', icon: 'trending-up', color: '#00C896' },
    loss: { label: 'Loss', icon: 'trending-down', color: '#FF5252' },
    dividend: { label: 'Dividend', icon: 'gift', color: '#9C27B0' },
    refund: { label: 'Refund', icon: 'refresh', color: '#2196F3' },
    default: { label: 'Transaction', icon: 'swap-horizontal', color: '#999999' },
};

const TYPE_LABELS = { credit: 'Credit', debit: 'Debit' };

const STATUS_LABELS = {
    completed: 'Completed',
    pending: 'Pending',
    failed: 'Failed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
};

/* ============================================================
   RESPONSIVE SHIMMER SKELETON
   - Single looping Animated.Value drives a diagonal light streak
     that sweeps across every skeleton card at once (useNativeDriver).
   - Block sizes use percentages + compact-aware pixel values so the
     skeleton scales correctly on small phones, tablets and folds.
   - Card count is computed from actual window height so the skeleton
     always fills the visible list area (no empty gap, no overflow).
   ============================================================ */

const SkeletonBlock = ({ width, height, radius = 8, style }) => (
    <View
        style={[
            {
                width,
                height,
                borderRadius: radius,
                backgroundColor: COLORS.skeletonBase,
            },
            style,
        ]}
    />
);

const ShimmerSweep = ({ translateX, sweepWidth }) => (
    <Animated.View
        pointerEvents="none"
        style={[
            styles.shimmerSweep,
            {
                width: sweepWidth,
                transform: [{ translateX }, { rotate: '10deg' }],
            },
        ]}
    />
);

const TransactionCardSkeleton = ({ compact, translateX, sweepWidth }) => {
    return (
        <View
            style={[
                styles.transactionCard,
                compact && styles.transactionCardCompact,
                styles.skeletonClip,
            ]}
        >
            <View style={styles.transactionContent}>
                <View style={styles.transactionLeft}>
                    <SkeletonBlock
                        width={compact ? 38 : 44}
                        height={compact ? 38 : 44}
                        radius={compact ? 19 : 22}
                        style={{ marginRight: compact ? 9 : 10 }}
                    />

                    <View style={styles.transactionInfo}>
                        <SkeletonBlock
                            width="72%"
                            height={compact ? 11 : 12}
                            radius={6}
                            style={{ marginBottom: 8 }}
                        />
                        <SkeletonBlock
                            width="44%"
                            height={9}
                            radius={5}
                            style={{ marginBottom: 8 }}
                        />
                        <View style={styles.skeletonMetaRow}>
                            <SkeletonBlock width={54} height={9} radius={5} />
                            <SkeletonBlock width={34} height={9} radius={5} />
                            {!compact && (
                                <SkeletonBlock width={48} height={14} radius={8} />
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.transactionRight}>
                    <SkeletonBlock
                        width={62}
                        height={compact ? 11 : 13}
                        radius={6}
                        style={{ marginBottom: 6, alignSelf: 'flex-end' }}
                    />
                    <SkeletonBlock
                        width={38}
                        height={9}
                        radius={5}
                        style={{ marginBottom: 6, alignSelf: 'flex-end' }}
                    />
                    <SkeletonBlock
                        width={14}
                        height={14}
                        radius={7}
                        style={{ alignSelf: 'flex-end' }}
                    />
                </View>
            </View>

            <ShimmerSweep translateX={translateX} sweepWidth={sweepWidth} />
        </View>
    );
};

const TransactionHistorySkeleton = ({ compact, translateX, sweepWidth, count }) => {
    return (
        <View style={styles.listContent}>
            {Array.from({ length: count }).map((_, index) => (
                <TransactionCardSkeleton
                    key={`skeleton-${index}`}
                    compact={compact}
                    translateX={translateX}
                    sweepWidth={sweepWidth}
                />
            ))}
        </View>
    );
};

const DetailRow = ({ label, value, mono = false, last = false }) => {
    if (!value && value !== 0) return null;

    return (
        <View style={[styles.modalRow, last && styles.modalRowLast]}>
            <Text style={styles.modalLabel}>{label}</Text>
            <Text style={[styles.modalValue, mono && styles.modalValueMono]}>{String(value)}</Text>
        </View>
    );
};

const TransactionDetailsModal = ({
    visible,
    item,
    onClose,
    compact,
    getTransactionMeta,
    getTransactionTitle,
    getTransactionSubText,
    getReadableType,
    getReadableStatus,
    getStatusColor,
    formatDateTime,
    formatAmountValue,
}) => {
    if (!item) return null;

    const meta = getTransactionMeta(item.category);
    const readableStatus = getReadableStatus(item.status);
    const statusColor = getStatusColor(item.status);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalCard, compact && styles.modalCardCompact]}>
                    <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={onClose}
                        activeOpacity={0.85}
                    >
                        <Icon name="close" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>

                    <View style={styles.modalTop}>
                        <View style={[styles.modalTopIcon, { backgroundColor: `${meta.color}18` }]}>
                            <Icon name={meta.icon} size={24} color={meta.color} />
                        </View>

                        <Text style={styles.modalTitle}>{getTransactionTitle(item)}</Text>
                        <Text style={styles.modalSubTitle}>{getTransactionSubText(item)}</Text>
                    </View>

                    <View style={styles.modalAmountWrap}>
                        <Text
                            style={[
                                styles.modalAmount,
                                { color: item.type === 'credit' ? COLORS.primary : COLORS.danger },
                            ]}
                        >
                            {item.type === 'credit' ? '+' : '-'}₹{formatAmountValue(item.amount)}
                        </Text>
                        <View style={[styles.modalStatusBadge, { backgroundColor: `${statusColor}18` }]}>
                            <Text style={[styles.modalStatusText, { color: statusColor }]}>
                                {readableStatus}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.modalDetailsBox}>
                        <DetailRow label="Type" value={getReadableType(item.type)} />
                        <DetailRow label="Category" value={meta.label} />
                        <DetailRow label="Date & Time" value={formatDateTime(item.createdAt)} />
                        <DetailRow label="Description" value={item?.description || '-'} />
                        <DetailRow
                            label="UTR Number"
                            value={item?.paymentDetails?.utrNumber || item?.withdrawalDetails?.utrNumber || '-'}
                            mono
                        />
                        <DetailRow
                            label="Bank Name"
                            value={item?.withdrawalDetails?.bankName || '-'}
                        />
                        <DetailRow
                            label="Stock Symbol"
                            value={item?.tradeDetails?.stockSymbol || '-'}
                        />
                        <DetailRow
                            label="Transaction ID"
                            value={item?._id || item?.id || '-'}
                            mono
                            last
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const TransactionHistoryScreen = ({ navigation }) => {
    const { width, height } = useWindowDimensions();
    const compact = width < 380;

    const [selectedFilter, setSelectedFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [detailsVisible, setDetailsVisible] = useState(false);

    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const hasLoadedOnceRef = useRef(false);

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1300,
                useNativeDriver: true,
            })
        );

        loop.start();
        return () => loop.stop();
    }, [shimmerAnim]);

    const sweepWidth = Math.max(90, width * 0.28);

    const shimmerTranslateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-sweepWidth * 1.6, width + sweepWidth],
    });

    // Fill the visible list area with just enough skeleton cards -
    // avoids empty white-space on tall screens and overflow on short ones.
    const skeletonCount = useMemo(() => {
        const cardHeight = compact ? 74 : 84;
        const chromeHeight = compact ? 205 : 225; // header + search + filter row
        const available = height - chromeHeight;
        const computed = Math.ceil(available / cardHeight);
        return Math.min(10, Math.max(5, computed));
    }, [height, compact]);

    const skeletonOpacity = shimmerAnim; // kept for backward-compat if referenced elsewhere

    const normalizeTransactions = useCallback((rawTransactions = []) => {
        return rawTransactions.filter((item) => item?.category !== 'signup_bonus');
    }, []);

    const fetchTransactions = useCallback(async (options = {}) => {
        const { showLoader = false, isPullToRefresh = false } = options;

        try {
            if (showLoader) setLoading(true);
            if (isPullToRefresh) setRefreshing(true);
            setErrorMessage('');

            const response = await ApiService.getAllTransactions();

            if (response?.success) {
                const rawTransactions = Array.isArray(response.data) ? response.data : [];
                const cleanedTransactions = normalizeTransactions(rawTransactions);
                setTransactions(cleanedTransactions);
                hasLoadedOnceRef.current = true;
            } else {
                const msg = response?.message || 'Failed to fetch transactions.';
                if (!hasLoadedOnceRef.current) {
                    setTransactions([]);
                }
                setErrorMessage(msg);
                console.error('❌ Failed to fetch transactions:', msg);
            }
        } catch (error) {
            const msg =
                error?.response?.data?.message ||
                error?.message ||
                'Unable to load transactions. Please try again.';
            if (!hasLoadedOnceRef.current) {
                setTransactions([]);
            }
            setErrorMessage(msg);
            console.error('❌ Error fetching transactions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [normalizeTransactions]);

    useFocusEffect(
        useCallback(() => {
            if (!hasLoadedOnceRef.current) {
                fetchTransactions({ showLoader: true });
            } else {
                fetchTransactions({ showLoader: false });
            }
        }, [fetchTransactions])
    );

    const onRefresh = () => {
        fetchTransactions({ isPullToRefresh: true });
    };

    function getTransactionMeta(category) {
        return CATEGORY_META[category] || CATEGORY_META.default;
    }

    function getReadableType(type) {
        return TYPE_LABELS[type] || 'Transaction';
    }

    function getReadableStatus(status) {
        return STATUS_LABELS[status] || 'Unknown';
    }

    function getTransactionTitle(item) {
        const categoryMeta = getTransactionMeta(item?.category);
        const category = item?.category;
        const stockSymbol = item?.tradeDetails?.stockSymbol;
        const bankName = item?.withdrawalDetails?.bankName;

        if (category === 'trade_buy' && stockSymbol) return `Bought ${stockSymbol}`;
        if (category === 'trade_sell' && stockSymbol) return `Sold ${stockSymbol}`;
        if (category === 'withdrawal' && bankName) return `Withdrawal to ${bankName}`;
        if (category === 'add_money') return 'Money Added';
        if (category === 'profit' && stockSymbol) return `Profit from ${stockSymbol}`;
        if (category === 'loss' && stockSymbol) return `Loss on ${stockSymbol}`;
        if (item?.description && item.description.trim()) return item.description.trim();

        return categoryMeta.label;
    }

    function getTransactionSubText(item) {
        if (item?.paymentDetails?.utrNumber) return `UTR: ${item.paymentDetails.utrNumber}`;
        if (item?.withdrawalDetails?.utrNumber) return `UTR: ${item.withdrawalDetails.utrNumber}`;
        if (item?.withdrawalDetails?.bankName) return `Bank: ${item.withdrawalDetails.bankName}`;
        if (item?.tradeDetails?.stockSymbol) return `Stock: ${item.tradeDetails.stockSymbol}`;
        return getReadableType(item?.type);
    }

    const counts = useMemo(() => {
        return {
            all: transactions.length,
            credit: transactions.filter((t) => t.type === 'credit').length,
            debit: transactions.filter((t) => t.type === 'debit').length,
            withdrawal: transactions.filter((t) => t.category === 'withdrawal').length,
            pending: transactions.filter((t) => t.status === 'pending').length,
        };
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter((transaction) => {
            if (transaction?.category === 'signup_bonus') return false;

            const matchesFilter =
                selectedFilter === 'all' ||
                (selectedFilter === 'credit' && transaction.type === 'credit') ||
                (selectedFilter === 'debit' && transaction.type === 'debit') ||
                (selectedFilter === 'withdrawal' && transaction.category === 'withdrawal') ||
                (selectedFilter === 'pending' && transaction.status === 'pending');

            const q = searchQuery.trim().toLowerCase();

            const userTitle = getTransactionTitle(transaction).toLowerCase();
            const userType = getReadableType(transaction.type).toLowerCase();
            const userStatus = getReadableStatus(transaction.status).toLowerCase();

            const matchesSearch =
                q === '' ||
                userTitle.includes(q) ||
                userType.includes(q) ||
                userStatus.includes(q) ||
                transaction.description?.toLowerCase().includes(q) ||
                transaction.paymentDetails?.utrNumber?.toLowerCase().includes(q) ||
                transaction.withdrawalDetails?.utrNumber?.toLowerCase().includes(q) ||
                transaction.withdrawalDetails?.bankName?.toLowerCase().includes(q) ||
                transaction.tradeDetails?.stockSymbol?.toLowerCase().includes(q) ||
                transaction.category?.toLowerCase().includes(q);

            return matchesFilter && matchesSearch;
        });
    }, [transactions, selectedFilter, searchQuery]);

    const getStatusColor = (status) => {
        const colors = {
            completed: '#00C896',
            pending: '#FF9800',
            failed: '#FF5252',
            rejected: '#FF5252',
            cancelled: '#999999',
        };
        return colors[status] || '#999999';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '-';

        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '-';

        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '-';

        return `${formatDate(dateString)} • ${formatTime(dateString)}`;
    };

    const formatAmountValue = (value) => {
        return Number(value || 0).toLocaleString('en-IN');
    };

    const openTransactionDetails = (item) => {
        setSelectedTransaction(item);
        setDetailsVisible(true);
    };

    const closeTransactionDetails = () => {
        setDetailsVisible(false);
        setTimeout(() => setSelectedTransaction(null), 180);
    };

    const renderTransactionItem = ({ item }) => {
        const meta = getTransactionMeta(item.category);
        const statusColor = getStatusColor(item.status);
        const title = getTransactionTitle(item);
        const subText = getTransactionSubText(item);
        const readableStatus = getReadableStatus(item.status);

        return (
            <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => openTransactionDetails(item)}
                style={[styles.transactionCard, compact && styles.transactionCardCompact]}
            >
                <View style={styles.transactionContent}>
                    <View style={styles.transactionLeft}>
                        <View
                            style={[
                                styles.transactionIcon,
                                compact && styles.transactionIconCompact,
                                { backgroundColor: `${meta.color}18` },
                            ]}>
                            <Icon name={meta.icon} size={compact ? 18 : 20} color={meta.color} />
                        </View>

                        <View style={styles.transactionInfo}>
                            <Text
                                numberOfLines={2}
                                style={[
                                    styles.transactionDescription,
                                    compact && styles.transactionDescriptionCompact,
                                ]}>
                                {title}
                            </Text>

                            {!!subText && (
                                <Text
                                    numberOfLines={1}
                                    style={[
                                        styles.transactionSubText,
                                        compact && styles.transactionSubTextCompact,
                                    ]}>
                                    {subText}
                                </Text>
                            )}

                            <View style={styles.transactionMeta}>
                                <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
                                <Text style={styles.transactionDot}>•</Text>
                                <Text style={styles.transactionTime}>{formatTime(item.createdAt)}</Text>

                                {item.status !== 'completed' && (
                                    <>
                                        <Text style={styles.transactionDot}>•</Text>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: `${statusColor}18` },
                                            ]}>
                                            <Text style={[styles.statusText, { color: statusColor }]}>
                                                {readableStatus}
                                            </Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={styles.transactionRight}>
                        <Text
                            numberOfLines={1}
                            style={[
                                styles.transactionAmount,
                                compact && styles.transactionAmountCompact,
                                { color: item.type === 'credit' ? COLORS.primary : COLORS.danger },
                            ]}>
                            {item.type === 'credit' ? '+' : '-'}₹{formatAmountValue(item.amount)}
                        </Text>
                        <Text
                            style={[
                                styles.transactionTypeText,
                                compact && styles.transactionTypeTextCompact,
                            ]}>
                            {getReadableType(item.type)}
                        </Text>
                        <Icon
                            name="chevron-right"
                            size={16}
                            color={COLORS.textDim}
                            style={styles.chevronIcon}
                        />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
                <View style={[styles.header, compact && styles.headerCompact]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={21} color="#FFFFFF" />
                    </TouchableOpacity>

                    <Text
                        style={[styles.headerTitle, compact && styles.headerTitleCompact]}
                        numberOfLines={1}>
                        Transaction History
                    </Text>

                    <View style={styles.downloadButton} />
                </View>

                <View style={[styles.searchContainer, compact && styles.searchContainerCompact]}>
                    <Icon name="magnify" size={17} color={COLORS.textMuted} />
                    <TextInput
                        style={[styles.searchInput, compact && styles.searchInputCompact]}
                        placeholder="Search transactions, UTR, bank..."
                        placeholderTextColor={COLORS.textDim}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Icon name="close-circle" size={17} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContainer}>
                    {FILTER_OPTIONS.map((filter) => {
                        const count = counts[filter.id] ?? 0;

                        return (
                            <TouchableOpacity
                                key={filter.id}
                                style={[
                                    styles.filterTab,
                                    compact && styles.filterTabCompact,
                                    selectedFilter === filter.id && styles.filterTabActive,
                                ]}
                                onPress={() => setSelectedFilter(filter.id)}
                                activeOpacity={0.76}>
                                <Icon
                                    name={filter.icon}
                                    size={15}
                                    color={selectedFilter === filter.id ? COLORS.primary : COLORS.textMuted}
                                />
                                <Text
                                    style={[
                                        styles.filterTabText,
                                        selectedFilter === filter.id && styles.filterTabTextActive,
                                    ]}>
                                    {filter.label}
                                </Text>
                                <View
                                    style={[
                                        styles.countBadge,
                                        selectedFilter === filter.id && styles.countBadgeActive,
                                    ]}>
                                    <Text
                                        style={[
                                            styles.countText,
                                            selectedFilter === filter.id && styles.countTextActive,
                                        ]}>
                                        {count}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </SafeAreaView>

            {loading ? (
                <TransactionHistorySkeleton
                    compact={compact}
                    translateX={shimmerTranslateX}
                    sweepWidth={sweepWidth}
                    count={skeletonCount}
                />
            ) : filteredTransactions.length > 0 ? (
                <FlatList
                    data={filteredTransactions}
                    renderItem={renderTransactionItem}
                    keyExtractor={(item, index) => item?._id || item?.id || `txn-${index}`}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={8}
                    ListHeaderComponent={
                        errorMessage ? (
                            <View style={styles.inlineInfoBanner}>
                                <Icon name="information-outline" size={16} color={COLORS.warning} />
                                <Text style={styles.inlineInfoBannerText}>{errorMessage}</Text>
                            </View>
                        ) : null
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                            colors={[COLORS.primary]}
                        />
                    }
                />
            ) : (
                <View style={styles.emptyState}>
                    <View style={styles.emptyStateIconWrap}>
                        <Icon name="receipt-text-outline" size={40} color={COLORS.textDim} />
                    </View>
                    <Text style={styles.emptyStateTitle}>
                        {errorMessage ? 'Unable to load transactions' : 'No transactions found'}
                    </Text>
                    <Text style={styles.emptyStateText}>
                        {errorMessage
                            ? errorMessage
                            : searchQuery
                                ? 'Try adjusting your search.'
                                : selectedFilter !== 'all'
                                    ? `No ${selectedFilter} transactions yet.`
                                    : 'Your transaction history will appear here.'}
                    </Text>

                    {errorMessage ? (
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => fetchTransactions({ showLoader: true })}>
                            <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                                animating={false}
                                style={{ display: 'none' }}
                            />
                            <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                    ) : null}

                    {(searchQuery || selectedFilter !== 'all') && !errorMessage && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => {
                                setSearchQuery('');
                                setSelectedFilter('all');
                            }}>
                            <Text style={styles.clearButtonText}>Clear Filters</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <TransactionDetailsModal
                visible={detailsVisible}
                item={selectedTransaction}
                onClose={closeTransactionDetails}
                compact={compact}
                getTransactionMeta={getTransactionMeta}
                getTransactionTitle={getTransactionTitle}
                getTransactionSubText={getTransactionSubText}
                getReadableType={getReadableType}
                getReadableStatus={getReadableStatus}
                getStatusColor={getStatusColor}
                formatDateTime={formatDateTime}
                formatAmountValue={formatAmountValue}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    safeAreaTop: { backgroundColor: COLORS.bg },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 9,
        backgroundColor: COLORS.bg,
    },
    headerCompact: { paddingVertical: 7 },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: 0.15,
    },
    headerTitleCompact: { fontSize: 15 },
    downloadButton: { width: 40, height: 40 },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        marginHorizontal: 16,
        marginTop: 7,
        marginBottom: 11,
        paddingHorizontal: 13,
        paddingVertical: 10,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchContainerCompact: { marginTop: 6, marginBottom: 9, paddingVertical: 9 },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: COLORS.text,
        marginLeft: 9,
        fontWeight: '500',
        padding: 0,
    },
    searchInputCompact: { fontSize: 12.5 },

    filterContainer: { paddingHorizontal: 16, paddingBottom: 13, gap: 8 },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 17,
        gap: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterTabCompact: { paddingHorizontal: 11, paddingVertical: 7 },
    filterTabActive: { backgroundColor: '#0D2B24', borderColor: COLORS.primary },
    filterTabText: { fontSize: 11.5, color: COLORS.textMuted, fontWeight: '700' },
    filterTabTextActive: { color: COLORS.primary },

    countBadge: {
        backgroundColor: '#2A2A2A',
        paddingHorizontal: 6,
        paddingVertical: 1.5,
        borderRadius: 10,
        minWidth: 18,
        alignItems: 'center',
    },
    countBadgeActive: { backgroundColor: COLORS.primary },
    countText: { fontSize: 9.5, color: COLORS.textMuted, fontWeight: '800' },
    countTextActive: { color: '#000000' },

    listContent: { paddingHorizontal: 16, paddingBottom: 18 },

    transactionCard: {
        backgroundColor: COLORS.card,
        padding: 12,
        borderRadius: 14,
        marginBottom: 9,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    transactionCardCompact: { padding: 11, marginBottom: 8 },
    skeletonClip: { overflow: 'hidden', position: 'relative' },

    transactionContent: { flexDirection: 'row', alignItems: 'flex-start' },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
        minWidth: 0,
        marginRight: 10,
    },
    transactionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        marginTop: 2,
    },
    transactionIconCompact: { width: 40, height: 40, borderRadius: 20, marginRight: 9 },
    transactionInfo: { flex: 1, minWidth: 0, flexShrink: 1 },
    transactionDescription: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 3,
        flexShrink: 1,
        flexWrap: 'wrap',
        lineHeight: 18,
    },
    transactionDescriptionCompact: { fontSize: 12.5, lineHeight: 17 },
    transactionSubText: {
        fontSize: 11,
        color: COLORS.textSoft,
        fontWeight: '500',
        marginBottom: 5,
        lineHeight: 15,
    },
    transactionSubTextCompact: { fontSize: 10.5, lineHeight: 14 },
    transactionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        rowGap: 5,
        columnGap: 5,
    },
    skeletonMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
    transactionDate: { fontSize: 10.5, color: COLORS.textMuted, fontWeight: '500' },
    transactionTime: { fontSize: 10.5, color: COLORS.textMuted, fontWeight: '500' },
    transactionDot: { fontSize: 10.5, color: COLORS.textDim },
    statusBadge: { paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 999 },
    statusText: { fontSize: 8.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.35 },

    transactionRight: {
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        marginLeft: 8,
        width: 88,
        flexShrink: 0,
    },
    transactionAmount: {
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.15,
        marginBottom: 3,
        textAlign: 'right',
    },
    transactionAmountCompact: { fontSize: 13 },
    transactionTypeText: {
        fontSize: 10,
        color: COLORS.textSoft,
        fontWeight: '600',
        marginBottom: 3,
        textAlign: 'right',
    },
    transactionTypeTextCompact: { fontSize: 9.5 },
    chevronIcon: { marginTop: 1 },

    // Shimmer sweep - a soft translucent diagonal streak animated across the card
    shimmerSweep: {
        position: 'absolute',
        top: -30,
        bottom: -30,
        backgroundColor: COLORS.skeletonHighlight,
    },

    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingTop: 10,
    },
    emptyStateIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 22,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyStateTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 8, textAlign: 'center' },
    emptyStateText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 18 },

    clearButton: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12 },
    clearButtonText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

    retryButton: {
        backgroundColor: COLORS.card2,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: 12,
    },
    retryButtonText: { fontSize: 13, fontWeight: '800', color: COLORS.text },

    inlineInfoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 152, 0, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 152, 0, 0.24)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 10,
        gap: 8,
    },
    inlineInfoBannerText: { flex: 1, fontSize: 12, color: '#FFD199', fontWeight: '600', lineHeight: 17 },

    modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', paddingHorizontal: 16 },
    modalCard: {
        backgroundColor: COLORS.card2,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 18,
        position: 'relative',
    },
    modalCardCompact: { padding: 16 },
    modalCloseButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.card,
        zIndex: 10,
    },
    modalTop: { alignItems: 'center', paddingTop: 12, marginBottom: 16 },
    modalTopIcon: {
        width: 58,
        height: 58,
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 6 },
    modalSubTitle: { fontSize: 12.5, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },
    modalAmountWrap: { alignItems: 'center', marginBottom: 16 },
    modalAmount: { fontSize: 24, fontWeight: '900', marginBottom: 10 },
    modalStatusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
    modalStatusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
    modalDetailsBox: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    modalRow: { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.borderSoft },
    modalRowLast: { borderBottomWidth: 0 },
    modalLabel: { fontSize: 11, color: COLORS.textSoft, fontWeight: '600', marginBottom: 5 },
    modalValue: { fontSize: 13, color: COLORS.text, fontWeight: '700', lineHeight: 18 },
    modalValueMono: { fontFamily: 'monospace' },
});

export default TransactionHistoryScreen;