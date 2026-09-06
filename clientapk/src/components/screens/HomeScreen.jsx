import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Animated,
    RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import BannerCarousel from './Home/BannerHome';
import MarketIndices from './Home/MarketIndices';
import StockCard from '../StockCard';
import ApiService from '../../services/ApiService';
import { SERVER_URL } from '../../config/api.config';

const AUTO_REFRESH_INTERVAL_MS = 30000;

const THEME = {
    bg: '#000000',
    card: '#1A1A1A',
    border: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#999999',
    textTertiary: '#666666',
    primary: '#00C896',
    statusBar: 'light-content',
    skeletonBase: '#1F1F1F',
    skeletonHighlight: '#2B2B2B',
};

const formatIndexValue = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '0';
    return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

const formatChangePercent = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '0.00%';
    const num = Number(value);
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
};

const resolveLogoUrl = (logoUrl) => {
    if (!logoUrl || typeof logoUrl !== 'string' || !logoUrl.trim()) return null;
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) return logoUrl;
    return `${SERVER_URL}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
};

const normalizeIndex = (item, index) => {
    const currentValue = Number(item?.currentValue ?? item?.value ?? 0);
    const previousClose = Number(item?.previousClose ?? 0);
    const highValue = Number(item?.highValue ?? item?.dayHigh ?? 0);
    const lowValue = Number(item?.lowValue ?? item?.dayLow ?? 0);
    const changePercent = Number(item?.changePercent ?? item?.percentageChange ?? 0);
    const change = Number(
        item?.change ?? (previousClose > 0 ? currentValue - previousClose : 0)
    );

    const isPositive =
        typeof item?.isPositive === 'boolean'
            ? item.isPositive
            : change >= 0 || changePercent >= 0;

    return {
        id: item?._id || item?.id || `index-${index}`,
        name: item?.name || 'Unnamed Index',
        ticker: item?.symbol || '',
        symbol: item?.symbol || '',
        price: formatIndexValue(currentValue),
        currentValue,
        rawValue: currentValue,
        previousClose,
        highValue,
        lowValue,
        change: formatChangePercent(changePercent),
        rawChangePercent: changePercent,
        rawChange: change,
        isPositive,
        logoUrl: resolveLogoUrl(item?.logoUrl),
        defaultDailyRate:
            item?.defaultDailyRate === null || item?.defaultDailyRate === undefined
                ? null
                : Number(item?.defaultDailyRate),
        description: item?.description || '',
        type: item?.type || 'Index',
        raw: item,
    };
};

const SkeletonBlock = ({ width, height, borderRadius = 10, style, animatedStyle, color }) => {
    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: color,
                },
                animatedStyle,
                style,
            ]}
        />
    );
};

const TopStocksSkeleton = ({ theme, shimmerAnim }) => {
    const shimmerOpacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.45, 1],
    });

    const animatedStyle = { opacity: shimmerOpacity };

    return (
        <View style={styles.skeletonSectionWrap}>
            <View style={styles.skeletonGrid}>
                {[1, 2, 3, 4].map((item) => (
                    <View
                        key={item}
                        style={[
                            styles.skeletonCard,
                            {
                                backgroundColor: theme.card,
                                borderColor: theme.border,
                            },
                        ]}
                    >
                        <View style={styles.skeletonTopRow}>
                            <SkeletonBlock
                                width={42}
                                height={42}
                                borderRadius={21}
                                color={theme.skeletonBase}
                                animatedStyle={animatedStyle}
                            />
                            <View style={styles.skeletonTopRight}>
                                <SkeletonBlock
                                    width={60}
                                    height={10}
                                    borderRadius={6}
                                    color={theme.skeletonBase}
                                    animatedStyle={animatedStyle}
                                />
                                <SkeletonBlock
                                    width={44}
                                    height={10}
                                    borderRadius={6}
                                    color={theme.skeletonBase}
                                    animatedStyle={animatedStyle}
                                    style={{ marginTop: 8 }}
                                />
                            </View>
                        </View>

                        <SkeletonBlock
                            width="78%"
                            height={13}
                            borderRadius={6}
                            color={theme.skeletonBase}
                            animatedStyle={animatedStyle}
                            style={{ marginTop: 14 }}
                        />

                        <SkeletonBlock
                            width="52%"
                            height={11}
                            borderRadius={6}
                            color={theme.skeletonBase}
                            animatedStyle={animatedStyle}
                            style={{ marginTop: 10 }}
                        />

                        <View style={styles.skeletonBottomRow}>
                            <SkeletonBlock
                                width={72}
                                height={12}
                                borderRadius={6}
                                color={theme.skeletonBase}
                                animatedStyle={animatedStyle}
                            />
                            <SkeletonBlock
                                width={54}
                                height={22}
                                borderRadius={11}
                                color={theme.skeletonHighlight}
                                animatedStyle={animatedStyle}
                            />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const HomeScreen = ({ navigation }) => {
    const theme = THEME;
    const route = useRoute();
    const unreadCountFromNotifications = route.params?.unreadCount || 0;

    const [topIndices, setTopIndices] = useState([]);
    const [loadingTopIndices, setLoadingTopIndices] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [backgroundUpdating, setBackgroundUpdating] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [loadError, setLoadError] = useState('');

    const shimmerAnim = useRef(new Animated.Value(0.45)).current;
    const intervalRef = useRef(null);

    const applyIndicesResponse = useCallback((response) => {
        if (response?.success && Array.isArray(response?.data)) {
            const normalizedData = response.data.map((item, index) =>
                normalizeIndex(item, index)
            );
            setTopIndices(normalizedData);
            setLoadError('');
            setHasLoadedOnce(true);
            return true;
        }

        return false;
    }, []);

    const fetchTopIndices = useCallback(
        async ({
            isRefresh = false,
            preferCache = true,
            backgroundRefresh = true,
            silent = false,
        } = {}) => {
            const shouldShowSkeleton =
                !hasLoadedOnce && topIndices.length === 0 && !isRefresh && !silent;
            const shouldShowBackgroundUpdating =
                (hasLoadedOnce || topIndices.length > 0) && !isRefresh && !silent;

            try {
                if (isRefresh) {
                    setRefreshing(true);
                } else if (shouldShowSkeleton) {
                    setLoadingTopIndices(true);
                } else if (shouldShowBackgroundUpdating) {
                    setBackgroundUpdating(true);
                }

                const response = await ApiService.getMarketIndices(
                    {},
                    {
                        preferCache,
                        backgroundRefresh,
                    }
                );

                const applied = applyIndicesResponse(response);

                if (!applied && topIndices.length === 0) {
                    setLoadError(
                        response?.message || 'Unable to load market indices right now.'
                    );
                }

                if (response?.fromCache) {
                    console.log('🗂️ HomeScreen: showing cached market indices');
                }

                if (response?.stale) {
                    console.log(
                        '🔄 HomeScreen: cached market indices are stale, background refresh running'
                    );
                }
            } catch (error) {
                console.error(
                    '❌ Home market indices fetch error:',
                    error?.response?.data || error?.message || error
                );

                if (topIndices.length === 0) {
                    setLoadError('Unable to load market.indices right now.');
                }
            } finally {
                setLoadingTopIndices(false);
                setRefreshing(false);
                setBackgroundUpdating(false);
            }
        },
        [applyIndicesResponse, hasLoadedOnce, topIndices.length]
    );

    useFocusEffect(
        useCallback(() => {
            fetchTopIndices({
                isRefresh: false,
                preferCache: true,
                backgroundRefresh: true,
                silent: false,
            });

            intervalRef.current = setInterval(() => {
                fetchTopIndices({
                    isRefresh: false,
                    preferCache: true,
                    backgroundRefresh: true,
                    silent: true,
                });
            }, AUTO_REFRESH_INTERVAL_MS);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            };
        }, [fetchTopIndices])
    );

    const handleRefresh = useCallback(() => {
        fetchTopIndices({
            isRefresh: true,
            preferCache: false,
            backgroundRefresh: false,
            silent: false,
        });
    }, [fetchTopIndices]);

    useEffect(() => {
        const shimmerLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 850,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0.45,
                    duration: 850,
                    useNativeDriver: true,
                }),
            ])
        );

        shimmerLoop.start();

        return () => {
            shimmerLoop.stop();
        };
    }, [shimmerAnim]);

    const visibleTopIndices = useMemo(() => topIndices.slice(0, 8), [topIndices]);

    const handleOpenStockDetail = useCallback(
        (stock) => {
            navigation.navigate('StockDetail', {
                stock: {
                    id: stock.id,
                    name: stock.name,
                    symbol: stock.symbol,
                    ticker: stock.ticker,
                    currentValue: stock.currentValue,
                    price: stock.currentValue,
                    rawValue: stock.rawValue,
                    previousClose: stock.previousClose,
                    highValue: stock.highValue,
                    lowValue: stock.lowValue,
                    change: stock.change,
                    rawChangePercent: stock.rawChangePercent,
                    rawChange: stock.rawChange,
                    isPositive: stock.isPositive,
                    logoUrl: stock.logoUrl,
                    defaultDailyRate: stock.defaultDailyRate,
                    description: stock.description,
                    type: stock.type || 'Index',
                },
            });
        },
        [navigation]
    );

    return (
        <View style={[styles.mainContainer, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

            <SafeAreaView
                style={[styles.container, { backgroundColor: theme.bg }]}
                edges={['top']}
            >
                <View
                    style={[
                        styles.header,
                        {
                            backgroundColor: theme.bg,
                            borderBottomColor: theme.border,
                        },
                    ]}
                >
                    <View style={styles.headerLeft}>
                        <View style={styles.logoContainer}>
                            <Icon name="chart-line-variant" size={20} color={theme.primary} />
                        </View>
                        <Text style={[styles.companyName, { color: theme.text }]}>
                            TradeHub
                        </Text>
                    </View>

                    <View style={styles.headerRight}>
                        <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveBadgeText}>Live</Text>
                        </View>

                        {/* Bell button that goes to Notification screen */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.notificationButton}
                            onPress={() => navigation.navigate('Notification')}
                        >
                            <Icon
                                name={
                                    unreadCountFromNotifications > 0
                                        ? 'bell-ring-outline'
                                        : 'bell-outline'
                                }
                                size={20}
                                color={theme.textSecondary}
                            />
                            {unreadCountFromNotifications > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationBadgeText}>
                                        {unreadCountFromNotifications > 9
                                            ? '9+'
                                            : unreadCountFromNotifications}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={theme.primary}
                    />
                }
            >
                <BannerCarousel theme={theme} />

                <MarketIndices theme={theme} navigation={navigation} />

                <View style={styles.stocksSection}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleWrap}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                Top Stocks
                            </Text>
                            <Text
                                style={[
                                    styles.sectionSubtitle,
                                    { color: theme.textSecondary },
                                ]}
                            >
                                Live market indices
                            </Text>
                        </View>

                        <View style={styles.sectionHeaderRight}>
                            {backgroundUpdating ? (
                                <View style={styles.updatingBadge}>
                                    <View style={styles.updatingDot} />
                                    <Text style={styles.updatingText}>Updating...</Text>
                                </View>
                            ) : null}

                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.viewAllButton}
                                onPress={() => navigation.navigate('Indices')}
                            >
                                <Text style={styles.viewAllText}>View All</Text>
                                <Icon
                                    name="chevron-right"
                                    size={15}
                                    color={theme.primary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {loadingTopIndices ? (
                        <TopStocksSkeleton theme={theme} shimmerAnim={shimmerAnim} />
                    ) : visibleTopIndices.length === 0 ? (
                        <View
                            style={[
                                styles.emptyWrap,
                                {
                                    backgroundColor: theme.card,
                                    borderColor: theme.border,
                                },
                            ]}
                        >
                            <Icon
                                name="database-off-outline"
                                size={26}
                                color={theme.textTertiary}
                            />
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>
                                No indices found
                            </Text>
                            <Text
                                style={[
                                    styles.emptyText,
                                    { color: theme.textSecondary },
                                ]}
                            >
                                {loadError || 'Unable to load market.indices right now.'}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.stockGrid}>
                            {visibleTopIndices.map((stock) => (
                                <View key={stock.id} style={styles.stockGridItem}>
                                    <StockCard
                                        stock={stock}
                                        theme={theme}
                                        onPress={() => handleOpenStockDetail(stock)}
                                    />
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    container: {},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 10,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoContainer: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#0D2B24',
        alignItems: 'center',
        justifyContent: 'center',
    },
    companyName: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(0,200,150,0.14)',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#00C896',
        marginRight: 6,
    },
    liveBadgeText: {
        fontSize: 11,
        color: '#00C896',
        fontWeight: '800',
    },
    notificationButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FF5252',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    notificationBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    scrollContent: {
        paddingBottom: 72,
    },
    stocksSection: {
        marginTop: 16,
        marginBottom: 18,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    sectionHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitleWrap: {
        flex: 1,
        paddingRight: 12,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 3,
    },
    sectionSubtitle: {
        fontSize: 11,
        fontWeight: '600',
    },
    updatingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    updatingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#00C896',
        marginRight: 6,
    },
    updatingText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingVertical: 4,
    },
    viewAllText: {
        fontSize: 12,
        color: '#00C896',
        fontWeight: '700',
    },
    skeletonSectionWrap: {
        paddingHorizontal: 10,
    },
    skeletonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    skeletonCard: {
        width: '50%',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        minHeight: 152,
    },
    skeletonTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    skeletonTopRight: {
        alignItems: 'flex-end',
        flex: 1,
        marginLeft: 12,
        paddingTop: 2,
    },
    skeletonBottomRow: {
        marginTop: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    emptyWrap: {
        marginHorizontal: 16,
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 22,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    emptyText: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
    stockGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 10,
    },
    stockGridItem: {
        width: '50%',
        paddingHorizontal: 6,
        marginBottom: 12,
    },
});

export default HomeScreen;