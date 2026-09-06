import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../../../services/ApiService';
import { SERVER_URL } from '../../../config/api.config';

const FALLBACK_FEATURED_INDICES = [
    {
        id: '1',
        name: 'NIFTY 50',
        symbol: 'NIFTY50',
        currentValue: 19443,
        previousClose: 19205,
        highValue: 19510,
        lowValue: 19180,
        changePercent: 1.24,
        change: 238,
        isPositive: true,
        defaultDailyRate: 1,
        categoryName: 'Indian Indices',
        description: 'India’s benchmark large-cap market index.',
        logoUrl: '',
    },
    {
        id: '2',
        name: 'SENSEX',
        symbol: 'SENSEX',
        currentValue: 64832,
        previousClose: 64205,
        highValue: 64980,
        lowValue: 64070,
        changePercent: 0.98,
        change: 627,
        isPositive: true,
        defaultDailyRate: 1.2,
        categoryName: 'Indian Indices',
        description: 'BSE benchmark index tracking leading companies.',
        logoUrl: '',
    },
    {
        id: '3',
        name: 'BANK NIFTY',
        symbol: 'BANKNIFTY',
        currentValue: 43567,
        previousClose: 42655,
        highValue: 43780,
        lowValue: 42590,
        changePercent: 2.14,
        change: 912,
        isPositive: true,
        defaultDailyRate: 2,
        categoryName: 'Banking',
        description: 'Tracks the performance of major banking stocks.',
        logoUrl: '',
    },
    {
        id: '4',
        name: 'NIFTY IT',
        symbol: 'NIFTYIT',
        currentValue: 30234,
        previousClose: 30370,
        highValue: 30440,
        lowValue: 30090,
        changePercent: -0.45,
        change: -136,
        isPositive: false,
        defaultDailyRate: 1.5,
        categoryName: 'Information Technology',
        description: 'Technology sector index with top IT companies.',
        logoUrl: '',
    },
];

const FALLBACK_INDICES_CATEGORIES = [
    { id: '1', title: 'All Indices', color: '#00C896', icon: 'view-grid', tab: 'All Indices' },
    { id: '2', title: 'Indian Indices', color: '#00C896', icon: 'flag', tab: 'Indian Indices' },
    { id: '3', title: 'Global Indices', color: '#2196F3', icon: 'earth', tab: 'Global Indices' },
    { id: '4', title: 'Crypto', color: '#FF9800', icon: 'bitcoin', tab: 'Crypto' },
];

const AUTO_REFRESH_INTERVAL_MS = 30000;

const formatIndexValue = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
    return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

const formatChangePercent = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '0.00%';
    const num = Number(value);
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
};

const formatDailyReturn = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
    return `${Number(value)}% daily return`;
};

const resolveLogoUrl = (logoUrl) => {
    if (!logoUrl || typeof logoUrl !== 'string' || !logoUrl.trim()) return null;

    const trimmed = logoUrl.trim();

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }

    return `${SERVER_URL.replace(/\/$/, '')}/${trimmed.replace(/^\//, '')}`;
};

const normalizeFeaturedIndex = (item, index) => {
    const currentValue = Number(
        item?.currentValue ??
        item?.currentPrice ??
        item?.livePrice ??
        item?.marketPrice ??
        item?.ltp ??
        item?.lastPrice ??
        item?.price ??
        item?.value ??
        0
    );

    const previousClose = Number(item?.previousClose ?? 0);
    const highValue = Number(item?.highValue ?? item?.dayHigh ?? 0);
    const lowValue = Number(item?.lowValue ?? item?.dayLow ?? 0);

    const changePercent = Number(
        item?.changePercent ??
        (previousClose > 0 ? ((currentValue - previousClose) / previousClose) * 100 : 0)
    );
    const change = Number(
        item?.change ?? (previousClose > 0 ? currentValue - previousClose : 0)
    );

    const isPositive =
        typeof item?.isPositive === 'boolean'
            ? item.isPositive
            : change >= 0 || changePercent >= 0;

    const resolvedLogoUrl = resolveLogoUrl(item?.logoUrl);

    return {
        id: String(item?._id || item?.id || `index-${index}`),
        name: item?.name || 'Unnamed Index',
        symbol: item?.symbol || '',
        currentValue,
        previousClose,
        highValue,
        lowValue,
        value: formatIndexValue(currentValue),
        change: formatChangePercent(changePercent),
        rawChange: change,
        rawChangePercent: changePercent,
        isPositive,
        logoUrl: resolvedLogoUrl,
        defaultDailyRate:
            item?.defaultDailyRate === null || item?.defaultDailyRate === undefined
                ? null
                : Number(item?.defaultDailyRate),
        categoryTitle:
            item?.category?.title ||
            item?.category?.name ||
            item?.categoryName ||
            '',
        description: item?.description || '',
        type: item?.type || 'Market',
        raw: item,
    };
};

const getCategoryIcon = (title = '') => {
    const text = String(title).toLowerCase();

    if (text.includes('all')) return 'view-grid';
    if (text.includes('indian') || text.includes('india')) return 'flag';
    if (text.includes('global') || text.includes('international') || text.includes('world')) return 'earth';
    if (text.includes('crypto') || text.includes('bitcoin')) return 'bitcoin';
    if (text.includes('bank')) return 'bank';
    if (text.includes('it')) return 'laptop';
    if (text.includes('metal')) return 'hammer';
    if (text.includes('energy')) return 'flash';
    return 'chart-line';
};

const getCategoryColor = (title = '') => {
    const text = String(title).toLowerCase();

    if (text.includes('all')) return '#00C896';
    if (text.includes('indian') || text.includes('india')) return '#00C896';
    if (text.includes('global') || text.includes('international') || text.includes('world')) return '#2196F3';
    if (text.includes('crypto') || text.includes('bitcoin')) return '#FF9800';
    if (text.includes('bank')) return '#9C27B0';
    if (text.includes('it')) return '#3F51B5';
    if (text.includes('metal')) return '#795548';
    if (text.includes('energy')) return '#F44336';
    return '#00C896';
};

const normalizeCategory = (item, index) => {
    const title = item?.title || item?.name || item?.categoryName || `Category ${index + 1}`;

    return {
        id: String(item?._id || item?.id || `cat-${index}`),
        title,
        color: item?.color || getCategoryColor(title),
        icon: item?.icon || getCategoryIcon(title),
        tab: item?.tab || title,
        raw: item,
    };
};

const ensureAllCategory = (items = []) => {
    const hasAll = items.some((item) => String(item?.title || '').toLowerCase() === 'all indices');
    if (hasAll) return items;

    return [
        { id: 'all-indices', title: 'All Indices', color: '#00C896', icon: 'view-grid', tab: 'All Indices' },
        ...items,
    ];
};

const IndexLogo = ({ logoUrl, isPositive }) => {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [logoUrl]);

    return (
        <View
            style={[
                styles.featuredIcon,
                { backgroundColor: isPositive ? '#0D2B24' : '#2A1F0D' },
            ]}
        >
            {logoUrl && !imgError ? (
                <Image
                    source={{ uri: logoUrl }}
                    style={styles.featuredIconImage}
                    resizeMode="contain"
                    onError={() => setImgError(true)}
                />
            ) : (
                <Icon
                    name={isPositive ? 'trending-up' : 'trending-down'}
                    size={20}
                    color={isPositive ? '#00C896' : '#FF5252'}
                />
            )}
        </View>
    );
};

const SkeletonBlock = ({ width, height, radius = 10, color, animatedStyle, style }) => {
    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius: radius,
                    backgroundColor: color,
                },
                animatedStyle,
                style,
            ]}
        />
    );
};

const FeaturedIndicesSkeleton = ({ theme, animatedStyle }) => {
    const skeletonColor = theme?.skeletonBase || (theme?.bg === '#000000' ? '#1F1F1F' : '#ECECEC');
    const skeletonHighlight = theme?.skeletonHighlight || (theme?.bg === '#000000' ? '#2B2B2B' : '#F5F5F5');

    return (
        <FlatList
            horizontal
            data={[1, 2, 3]}
            keyExtractor={(item) => `featured-skeleton-${item}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
            renderItem={() => (
                <View
                    style={[
                        styles.featuredCard,
                        {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                            shadowColor: '#000',
                        },
                    ]}
                >
                    <View style={styles.cardTopRow}>
                        <SkeletonBlock
                            width={42}
                            height={42}
                            radius={21}
                            color={skeletonColor}
                            animatedStyle={animatedStyle}
                        />
                        <SkeletonBlock
                            width={72}
                            height={24}
                            radius={8}
                            color={skeletonHighlight}
                            animatedStyle={animatedStyle}
                        />
                    </View>

                    <SkeletonBlock
                        width="76%"
                        height={13}
                        radius={6}
                        color={skeletonColor}
                        animatedStyle={animatedStyle}
                    />

                    <SkeletonBlock
                        width="44%"
                        height={10}
                        radius={6}
                        color={skeletonColor}
                        animatedStyle={animatedStyle}
                        style={{ marginTop: 8 }}
                    />

                    <SkeletonBlock
                        width="62%"
                        height={20}
                        radius={6}
                        color={skeletonColor}
                        animatedStyle={animatedStyle}
                        style={{ marginTop: 12 }}
                    />

                    <SkeletonBlock
                        width={72}
                        height={24}
                        radius={8}
                        color={skeletonHighlight}
                        animatedStyle={animatedStyle}
                        style={{ marginTop: 12 }}
                    />
                </View>
            )}
        />
    );
};

const CategoriesSkeleton = ({ theme, animatedStyle }) => {
    const skeletonColor = theme?.skeletonBase || (theme?.bg === '#000000' ? '#1F1F1F' : '#ECECEC');

    return (
        <View style={styles.categoriesGrid}>
            {[1, 2, 3, 4].map((item) => (
                <View
                    key={`cat-skeleton-${item}`}
                    style={[
                        styles.categoryCard,
                        {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                        },
                    ]}
                >
                    <SkeletonBlock
                        width={44}
                        height={44}
                        radius={22}
                        color={skeletonColor}
                        animatedStyle={animatedStyle}
                    />

                    <View style={styles.categoryContent}>
                        <SkeletonBlock
                            width="58%"
                            height={13}
                            radius={6}
                            color={skeletonColor}
                            animatedStyle={animatedStyle}
                        />
                        <SkeletonBlock
                            width="84%"
                            height={10}
                            radius={6}
                            color={skeletonColor}
                            animatedStyle={animatedStyle}
                            style={{ marginTop: 8 }}
                        />
                    </View>

                    <SkeletonBlock
                        width={18}
                        height={18}
                        radius={9}
                        color={skeletonColor}
                        animatedStyle={animatedStyle}
                    />
                </View>
            ))}
        </View>
    );
};

const MarketIndices = ({ theme, navigation }) => {
    const [featuredIndices, setFeaturedIndices] = useState([]);
    const [loadingFeatured, setLoadingFeatured] = useState(true);

    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [backgroundUpdating, setBackgroundUpdating] = useState(false);

    const shimmerAnim = useRef(new Animated.Value(0.45)).current;
    const intervalRef = useRef(null);

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

    const skeletonAnimatedStyle = useMemo(() => {
        const opacity = shimmerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.45, 1],
        });

        return { opacity };
    }, [shimmerAnim]);

    const featuredIndicesWithViewAll = useMemo(() => {
        const source =
            featuredIndices.length > 0
                ? featuredIndices
                : FALLBACK_FEATURED_INDICES.map((item, index) =>
                    normalizeFeaturedIndex(item, index)
                );

        return [...source, { id: 'view-all' }];
    }, [featuredIndices]);

    const categoriesToRender = useMemo(() => {
        return categories.length > 0 ? categories : FALLBACK_INDICES_CATEGORIES;
    }, [categories]);

    const applyFeaturedIndices = useCallback((response) => {
        const rawList = Array.isArray(response?.data) ? response.data : [];

        if (rawList.length > 0) {
            setFeaturedIndices(rawList.map((item, index) => normalizeFeaturedIndex(item, index)));
            return true;
        }

        setFeaturedIndices([]);
        return false;
    }, []);

    const applyCategories = useCallback((response) => {
        const rawList = Array.isArray(response?.data) ? response.data : [];

        if (rawList.length > 0) {
            const normalized = rawList.map((item, index) => normalizeCategory(item, index));
            setCategories(ensureAllCategory(normalized));
            return true;
        }

        setCategories([]);
        return false;
    }, []);

    const fetchFeaturedIndices = useCallback(
        async ({ preferCache = true, backgroundRefresh = true, showLoader = false } = {}) => {
            try {
                if (showLoader) {
                    setLoadingFeatured(true);
                }

                const response = await ApiService.getFeaturedIndices({
                    preferCache,
                    backgroundRefresh,
                });

                applyFeaturedIndices(response);
            } catch (error) {
                console.error('❌ Featured indices fetch error:', error?.response?.data || error.message || error);
                if (featuredIndices.length === 0) {
                    setFeaturedIndices([]);
                }
            } finally {
                setLoadingFeatured(false);
            }
        },
        [applyFeaturedIndices, featuredIndices.length]
    );

    const fetchCategories = useCallback(
        async ({ preferCache = true, backgroundRefresh = true, showLoader = false } = {}) => {
            try {
                if (showLoader) {
                    setLoadingCategories(true);
                }

                const response = await ApiService.getActiveMarketCategories({
                    preferCache,
                    backgroundRefresh,
                });

                applyCategories(response);
            } catch (error) {
                console.error('❌ Categories fetch error:', error?.response?.data || error.message || error);
                if (categories.length === 0) {
                    setCategories([]);
                }
            } finally {
                setLoadingCategories(false);
            }
        },
        [applyCategories, categories.length]
    );

    const refreshData = useCallback(
        async ({ preferCache = true, backgroundRefresh = true, silent = false } = {}) => {
            const shouldShowInitialLoader = !hasLoadedOnce && !silent;

            try {
                if (!shouldShowInitialLoader) {
                    setBackgroundUpdating(true);
                }

                if (shouldShowInitialLoader) {
                    setLoadingFeatured(true);
                    setLoadingCategories(true);
                }

                await Promise.all([
                    fetchFeaturedIndices({
                        preferCache,
                        backgroundRefresh,
                        showLoader: shouldShowInitialLoader,
                    }),
                    fetchCategories({
                        preferCache,
                        backgroundRefresh,
                        showLoader: shouldShowInitialLoader,
                    }),
                ]);

                setHasLoadedOnce(true);
            } catch (error) {
                console.error('❌ MarketIndices refresh error:', error?.message || error);
            } finally {
                setBackgroundUpdating(false);
            }
        },
        [hasLoadedOnce, fetchFeaturedIndices, fetchCategories]
    );

    useFocusEffect(
        useCallback(() => {
            refreshData({
                preferCache: true,
                backgroundRefresh: true,
                silent: false,
            });

            intervalRef.current = setInterval(() => {
                refreshData({
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
        }, [refreshData])
    );

    const handleFeaturedPress = (item) => {
        navigation.navigate('StockDetail', {
            stock: {
                id: item.id,
                _id: item.id,
                name: item.name,
                symbol: item.symbol,
                price: item.currentValue,
                currentValue: item.currentValue,
                previousClose: item.previousClose,
                highValue: item.highValue,
                lowValue: item.lowValue,
                rawChange: item.rawChange,
                rawChangePercent: item.rawChangePercent,
                isPositive: item.isPositive,
                logoUrl: item.logoUrl || '',
                defaultDailyRate: item.defaultDailyRate,
                categoryTitle: item.categoryTitle,
                categoryName: item.categoryTitle,
                description: item.description,
                type: item.type,
            },
        });
    };

    const renderFeaturedItem = ({ item }) => {
        if (item.id === 'view-all') {
            return (
                <TouchableOpacity
                    style={[
                        styles.viewAllCard,
                        {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                        },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Indices', { tab: 'All Indices' })}
                >
                    <View style={styles.viewAllIconWrap}>
                        <Icon name="arrow-right-circle" size={34} color={theme.primary} />
                    </View>
                    <Text style={[styles.viewAllCardTitle, { color: theme.text }]}>View All</Text>
                    <Text style={[styles.viewAllCardSubtitle, { color: theme.textSecondary }]}>
                        Indices
                    </Text>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                style={[
                    styles.featuredCard,
                    {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        shadowColor: '#000',
                    },
                ]}
                activeOpacity={0.92}
                onPress={() => handleFeaturedPress(item)}
            >
                <View style={styles.cardTopRow}>
                    <IndexLogo logoUrl={item.logoUrl} isPositive={item.isPositive} />
                    {item.defaultDailyRate !== null ? (
                        <View style={styles.returnBadge}>
                            <Icon name="cash-fast" size={10} color="#00C896" />
                            <Text style={styles.returnBadgeText} numberOfLines={1}>
                                {formatDailyReturn(item.defaultDailyRate)}
                            </Text>
                        </View>
                    ) : null}
                </View>

                <Text style={[styles.featuredName, { color: theme.text }]} numberOfLines={1}>
                    {item.name}
                </Text>

                {!!item.symbol && (
                    <Text
                        style={[styles.featuredSymbol, { color: theme.textSecondary }]}
                        numberOfLines={1}
                    >
                        {item.symbol}
                    </Text>
                )}

                <Text style={[styles.featuredValue, { color: theme.text }]} numberOfLines={1}>
                    ₹ {item.value}
                </Text>

                <View
                    style={[
                        styles.featuredChange,
                        {
                            backgroundColor: item.isPositive ? '#0D2B24' : '#2A1A1A',
                        },
                    ]}
                >
                    <Icon
                        name={item.isPositive ? 'arrow-up' : 'arrow-down'}
                        size={10}
                        color={item.isPositive ? '#00C896' : '#FF5252'}
                    />
                    <Text
                        style={[
                            styles.featuredChangeText,
                            { color: item.isPositive ? '#00C896' : '#FF5252' },
                        ]}
                    >
                        {item.change}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <>
            <View style={styles.indicesSection}>
                <View style={styles.featuredSectionHeader}>
                    <Text style={[styles.featuredSectionTitle, { color: theme.text }]}>Top Indices</Text>
                    <View style={styles.headerRight}>
                        {backgroundUpdating ? (
                            <View style={styles.updatingBadge}>
                                <View style={styles.updatingDot} />
                                <Text style={styles.updatingText}>Updating...</Text>
                            </View>
                        ) : null}
                        <Icon name="chart-timeline-variant" size={18} color="#00C896" />
                    </View>
                </View>

                {loadingFeatured ? (
                    <FeaturedIndicesSkeleton
                        theme={theme}
                        animatedStyle={skeletonAnimatedStyle}
                    />
                ) : (
                    <FlatList
                        horizontal
                        data={featuredIndicesWithViewAll}
                        renderItem={renderFeaturedItem}
                        keyExtractor={(item) => item.id}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.featuredList}
                    />
                )}
            </View>

            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Market Indices</Text>
                <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => navigation.navigate('Indices', { tab: 'All Indices' })}
                >
                    <Text style={styles.viewAllText}>View All</Text>
                    <Icon name="chevron-right" size={16} color="#00C896" />
                </TouchableOpacity>
            </View>

            {loadingCategories ? (
                <CategoriesSkeleton
                    theme={theme}
                    animatedStyle={skeletonAnimatedStyle}
                />
            ) : (
                <View style={styles.categoriesGrid}>
                    {categoriesToRender.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryCard,
                                {
                                    backgroundColor: theme.card,
                                    borderColor: theme.border,
                                },
                            ]}
                            activeOpacity={0.82}
                            onPress={() => navigation.navigate('Indices', { tab: cat.tab })}
                        >
                            <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}20` }]}>
                                <Icon name={cat.icon} size={22} color={cat.color} />
                            </View>

                            <View style={styles.categoryContent}>
                                <Text style={[styles.categoryTitle, { color: theme.text }]} numberOfLines={1}>
                                    {cat.title}
                                </Text>
                                <Text style={[styles.categorySubtitle, { color: theme.textSecondary }]}>
                                    Explore market opportunities
                                </Text>
                            </View>

                            <Icon name="chevron-right" size={18} color={theme.textTertiary} />
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    indicesSection: {
        marginBottom: 22,
    },
    featuredSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginBottom: 12,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    updatingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(0, 200, 150, 0.12)',
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
        color: '#00C896',
        fontWeight: '700',
    },
    featuredSectionTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    featuredList: {
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    featuredCard: {
        width: 156,
        minHeight: 156,
        borderRadius: 18,
        padding: 12,
        marginRight: 12,
        borderWidth: 1,
        justifyContent: 'space-between',
        shadowOpacity: 0.14,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 10,
        elevation: 4,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    featuredIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    featuredIconImage: {
        width: 26,
        height: 26,
        borderRadius: 6,
    },
    returnBadge: {
        maxWidth: 88,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#0D2B24',
        borderColor: 'rgba(0, 200, 150, 0.25)',
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 8,
    },
    returnBadgeText: {
        color: '#00C896',
        fontSize: 9,
        fontWeight: '800',
        flexShrink: 1,
    },
    featuredName: {
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 2,
    },
    featuredSymbol: {
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    featuredValue: {
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 8,
    },
    featuredChange: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 4,
        alignSelf: 'flex-start',
    },
    featuredChangeText: {
        fontSize: 11,
        fontWeight: '800',
    },
    viewAllCard: {
        width: 136,
        minHeight: 156,
        borderRadius: 18,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    viewAllIconWrap: {
        marginBottom: 8,
    },
    viewAllCardTitle: {
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 4,
        marginTop: 2,
    },
    viewAllCardSubtitle: {
        fontSize: 11,
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    viewAllText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#00C896',
    },
    categoriesGrid: {
        marginHorizontal: 16,
        gap: 10,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 13,
        borderRadius: 14,
        borderWidth: 1,
    },
    categoryIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    categoryContent: {
        flex: 1,
        marginRight: 8,
    },
    categoryTitle: {
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 2,
    },
    categorySubtitle: {
        fontSize: 11,
        fontWeight: '500',
    },
});

export default MarketIndices;