import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Image,
    ScrollView,
    Animated,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../../../../services/ApiService';
import { SERVER_URL } from '../../../../config/api.config';

const AUTO_REFRESH_INTERVAL_MS = 30000;

const formatCurrency = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
    return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const formatPercent = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '0.00%';
    const num = Number(value);
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
};

const formatDailyReturn = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
    return `${Number(value)}% daily`;
};

const resolveLogoUrl = (logoUrl) => {
    if (!logoUrl || typeof logoUrl !== 'string' || !logoUrl.trim()) return null;

    const trimmed = logoUrl.trim();

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }

    return `${SERVER_URL.replace(/\/$/, '')}/${trimmed.replace(/^\//, '')}`;
};

const normalizeDetails = (raw, fallbackStock = {}) => {
    const currentValue = Number(
        raw?.currentValue ??
        raw?.value ??
        fallbackStock?.rawValue ??
        fallbackStock?.currentValue ??
        fallbackStock?.price ??
        0
    );

    const previousClose = Number(raw?.previousClose ?? fallbackStock?.previousClose ?? 0);
    const change = Number(raw?.change ?? fallbackStock?.rawChange ?? currentValue - previousClose);

    const changePercent = Number(
        raw?.changePercent ??
        fallbackStock?.rawChangePercent ??
        (previousClose > 0 ? (((currentValue - previousClose) / previousClose) * 100).toFixed(2) : 0)
    );

    const rawLogoUrl = raw?.logoUrl || fallbackStock?.logoUrl || '';
    const finalLogoUrl = resolveLogoUrl(rawLogoUrl);
    const resolvedId = raw?._id || raw?.id || fallbackStock?._id || fallbackStock?.id || '';

    return {
        id: resolvedId,
        _id: resolvedId,
        name: raw?.name || fallbackStock?.name || 'Unknown Index',
        symbol: raw?.symbol || fallbackStock?.symbol || fallbackStock?.ticker || '',
        currentValue,
        previousClose,
        highValue: Number(raw?.highValue ?? raw?.dayHigh ?? fallbackStock?.highValue ?? 0),
        lowValue: Number(raw?.lowValue ?? raw?.dayLow ?? fallbackStock?.lowValue ?? 0),
        change,
        changePercent,
        defaultDailyRate:
            raw?.defaultDailyRate === null || raw?.defaultDailyRate === undefined
                ? fallbackStock?.defaultDailyRate ?? null
                : Number(raw.defaultDailyRate),
        minimumInvestment:
            raw?.minimumInvestment === null || raw?.minimumInvestment === undefined
                ? fallbackStock?.minimumInvestment ?? fallbackStock?.minInvestment ?? null
                : Number(raw.minimumInvestment),
        lockPeriodDays:
            raw?.lockPeriodDays === null || raw?.lockPeriodDays === undefined
                ? fallbackStock?.lockPeriodDays ?? fallbackStock?.periodDays ?? fallbackStock?.lockDays ?? 0
                : Number(raw.lockPeriodDays),
        description: raw?.description || fallbackStock?.description || '',
        categoryName:
            raw?.categoryName ||
            raw?.category?.name ||
            fallbackStock?.categoryName ||
            '',
        rawLogoUrl,
        logoUrl: finalLogoUrl,
        isPositive:
            typeof raw?.isPositive === 'boolean'
                ? raw.isPositive
                : change >= 0 || changePercent >= 0,
        type: raw?.type || fallbackStock?.type || 'Index',
    };
};

const SkeletonBlock = ({ width, height, radius = 8, style }) => {
    const opacity = React.useRef(new Animated.Value(0.35)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 550,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.35,
                    duration: 550,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius: radius,
                    backgroundColor: '#1E1E1E',
                    opacity,
                },
                style,
            ]}
        />
    );
};

const StockDetailSkeleton = ({ screenWidth }) => {
    const cardWidth = screenWidth - 32;

    return (
        <View style={{ paddingHorizontal: 16 }}>
            <View style={[styles.heroCard, { width: cardWidth }]}>
                <View style={styles.topRow}>
                    <SkeletonBlock width={52} height={52} radius={26} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <SkeletonBlock width="60%" height={16} style={{ marginBottom: 8 }} />
                        <SkeletonBlock width="35%" height={12} />
                    </View>
                    <SkeletonBlock width={60} height={22} radius={8} />
                </View>

                <SkeletonBlock width="45%" height={30} style={{ marginBottom: 14, marginTop: 6 }} />

                <SkeletonBlock width="100%" height={54} radius={14} style={{ marginBottom: 14 }} />

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={{ width: '50%', paddingHorizontal: 4, marginBottom: 8 }}>
                            <SkeletonBlock width="100%" height={36} radius={10} />
                        </View>
                    ))}
                </View>
            </View>

            <View style={[styles.investmentInfoCard, { width: cardWidth }]}>
                <SkeletonBlock width="55%" height={18} style={{ marginBottom: 10 }} />
                <SkeletonBlock width="80%" height={12} style={{ marginBottom: 18 }} />

                {[1, 2, 3].map((i) => (
                    <View key={i} style={{ flexDirection: 'row', marginBottom: 16 }}>
                        <SkeletonBlock width={32} height={32} radius={16} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <SkeletonBlock width="40%" height={13} style={{ marginBottom: 6 }} />
                            <SkeletonBlock width="90%" height={11} />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const DetailLogo = ({ logoUrl, isPositive, size }) => {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [logoUrl]);

    return (
        <View
            style={[
                styles.logoWrap,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: isPositive ? '#0D2B24' : '#2A1F0D',
                },
            ]}
        >
            {logoUrl && !imgError ? (
                <Image
                    source={{ uri: logoUrl }}
                    style={{ width: size * 0.58, height: size * 0.58, borderRadius: 6 }}
                    resizeMode="contain"
                    onError={() => {
                        setImgError(true);
                    }}
                />
            ) : (
                <Icon
                    name={isPositive ? 'trending-up' : 'trending-down'}
                    size={size * 0.46}
                    color={isPositive ? '#00C896' : '#FF9800'}
                />
            )}
        </View>
    );
};

const MiniStatCard = ({ label, value, minWidth }) => (
    <View style={[styles.miniStatCard, { minWidth }]}>
        <Text style={styles.miniStatLabel}>{label}</Text>
        <Text style={styles.miniStatValue}>{value}</Text>
    </View>
);

const BenefitRow = ({ icon, title, text }) => (
    <View style={styles.benefitRow}>
        <View style={styles.benefitIconWrap}>
            <Icon name={icon} size={16} color="#00C896" />
        </View>
        <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>{title}</Text>
            <Text style={styles.benefitText}>{text}</Text>
        </View>
    </View>
);

const StockDetailScreen = ({ navigation, route }) => {
    const { width: screenWidth } = useWindowDimensions();
    const isSmallDevice = screenWidth < 360;
    const isTablet = screenWidth >= 768;

    const stock = route?.params?.stock || {};
    const indexId = stock?.id || stock?._id || '';
    const symbol = stock?.symbol || stock?.ticker || '';

    const initialDetails = normalizeDetails(null, stock);
    const [details, setDetails] = useState(initialDetails);
    const [loading, setLoading] = useState(!indexId && !initialDetails?.name);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [backgroundUpdating, setBackgroundUpdating] = useState(false);

    const intervalRef = useRef(null);

    const applyDetails = useCallback(
        (rawData) => {
            const normalized = normalizeDetails(rawData, stock);
            setDetails(normalized);
            return normalized;
        },
        [stock]
    );

    const fetchDetails = useCallback(
        async ({ preferCache = true, backgroundRefresh = true, showLoader = false } = {}) => {
            if (!indexId) {
                setLoading(false);
                return;
            }

            try {
                if (showLoader) {
                    setLoading(true);
                } else {
                    setBackgroundUpdating(true);
                }

                const detailResponse = await ApiService.getMarketIndexDetails(indexId, {
                    preferCache,
                    backgroundRefresh,
                });

                if (detailResponse?.success && detailResponse?.data) {
                    applyDetails(detailResponse.data);
                } else {
                    applyDetails(null);
                }

                setHasLoadedOnce(true);
            } catch (error) {
                console.error('❌ Screen fetch error:', error?.response?.data || error.message || error);
                applyDetails(null);
            } finally {
                setLoading(false);
                setBackgroundUpdating(false);
            }
        },
        [indexId, applyDetails]
    );

    const refreshData = useCallback(
        async ({ preferCache = true, backgroundRefresh = true, silent = false } = {}) => {
            const hasUsableInitialData = !!(
                stock?.name ||
                stock?.currentValue ||
                stock?.price ||
                stock?.rawValue
            );

            const shouldShowInitialLoader = !hasLoadedOnce && !silent && !hasUsableInitialData;

            await fetchDetails({
                preferCache,
                backgroundRefresh,
                showLoader: shouldShowInitialLoader,
            });
        },
        [hasLoadedOnce, stock, fetchDetails]
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

    useEffect(() => {
        if (indexId) {
            setDetails(normalizeDetails(null, stock));
        }
    }, [indexId, stock]);

    const isPositive = details?.isPositive;
    const accentColor = isPositive ? '#00C896' : '#FF9800';

    const effectiveDailyRate = details?.defaultDailyRate ?? stock?.defaultDailyRate ?? 0;

    const minimumTradeAmount =
        details?.minimumInvestment ?? stock?.minimumInvestment ?? stock?.minInvestment ?? 0;

    const lockDays =
        details?.lockPeriodDays ?? stock?.lockPeriodDays ?? stock?.periodDays ?? stock?.lockDays ?? 0;

    const handleBuyStock = () => {
        navigation.navigate('BuyStock', {
            stock: {
                ...stock,
                ...details,
                id: details?.id || indexId,
                _id: details?._id || indexId,
                symbol: details?.symbol || symbol,
                currentValue: details?.currentValue || 0,
                price: details?.currentValue || 0,
                logoUrl: details?.logoUrl || '',
                defaultDailyRate: effectiveDailyRate,
                minimumInvestment: minimumTradeAmount,
                minInvestment: minimumTradeAmount,
                lockPeriodDays: lockDays,
                periodDays: lockDays,
                lockDays,
                type: details?.type || 'Index',
            },
            minimumTradeAmount,
            lockDays,
            lockPeriodDays: lockDays,
            defaultDailyRate: effectiveDailyRate || 0,
        });
    };

    const logoSize = isTablet ? 64 : isSmallDevice ? 46 : 52;
    const priceFontSize = isTablet ? 36 : isSmallDevice ? 26 : 30;
    const statMinWidth = isTablet ? '25%' : '48%';
    const contentMaxWidth = isTablet ? 640 : undefined;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={22} color="#FFFFFF" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Index Details</Text>

                    <View style={styles.headerRight}>
                        {backgroundUpdating ? (
                            <View style={styles.updatingBadge}>
                                <View style={styles.updatingDot} />
                                <Text style={styles.updatingText}>Updating...</Text>
                            </View>
                        ) : null}
                        <View style={styles.headerBtn} />
                    </View>
                </View>
            </SafeAreaView>

            {loading ? (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={{ alignSelf: 'center', width: '100%', maxWidth: contentMaxWidth }}>
                        <StockDetailSkeleton screenWidth={screenWidth} />
                    </View>
                </ScrollView>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={{ alignSelf: 'center', width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: 16 }}>
                        <View style={styles.heroCard}>
                            <View style={styles.topRow}>
                                <DetailLogo logoUrl={details.logoUrl} isPositive={details.isPositive} size={logoSize} />

                                <View style={styles.topInfo}>
                                    <Text style={styles.name} numberOfLines={1}>
                                        {details.name}
                                    </Text>
                                    {!!details.symbol && <Text style={styles.symbol}>{details.symbol}</Text>}
                                    {!!details.categoryName && (
                                        <Text style={styles.category}>{details.categoryName}</Text>
                                    )}
                                </View>

                                <View
                                    style={[
                                        styles.changeBadge,
                                        { backgroundColor: isPositive ? '#0D2B24' : '#2A1F0D' },
                                    ]}
                                >
                                    <Icon
                                        name={isPositive ? 'arrow-up' : 'arrow-down'}
                                        size={10}
                                        color={accentColor}
                                    />
                                    <Text style={[styles.changeText, { color: accentColor }]}>
                                        {formatPercent(details.changePercent)}
                                    </Text>
                                </View>
                            </View>

                            <Text style={[styles.price, { fontSize: priceFontSize }]}>
                                {formatCurrency(details.currentValue)}
                            </Text>

                            <View style={styles.returnCard}>
                                <View>
                                    <Text style={styles.returnLabel}>Daily Return</Text>
                                    <Text style={styles.returnSubLabel}>Fixed rate</Text>
                                </View>

                                <Text style={styles.returnValue}>
                                    {formatDailyReturn(effectiveDailyRate)}
                                </Text>
                            </View>

                            <View style={styles.compactStatsGrid}>
                                <MiniStatCard label="Last open" value={formatCurrency(details.previousClose)} minWidth={statMinWidth} />
                                <MiniStatCard label="Last close" value={formatCurrency(details.currentValue)} minWidth={statMinWidth} />
                                <MiniStatCard label="52 weeks/High" value={formatCurrency(details.highValue)} minWidth={statMinWidth} />
                                <MiniStatCard label="52 weeks/Low" value={formatCurrency(details.lowValue)} minWidth={statMinWidth} />
                            </View>

                            <View style={styles.compactMetaRow}>
                                <View style={styles.metaChip}>
                                    <Text style={styles.metaChipText}>
                                        Change {formatCurrency(details.change)}
                                    </Text>
                                </View>
                                <View style={styles.metaChip}>
                                    <Text style={styles.metaChipText}>
                                        Min. invest {formatCurrency(minimumTradeAmount)}
                                    </Text>
                                </View>
                                <View style={styles.metaChip}>
                                    <Text style={styles.metaChipText}>
                                        {lockDays}-day cycle
                                    </Text>
                                </View>
                            </View>

                            {!!details.description && (
                                <Text style={styles.description}>{details.description}</Text>
                            )}
                        </View>

                        <View style={styles.investmentInfoCard}>
                            <View style={styles.infoHeaderRow}>
                                <View style={styles.infoTitleWrap}>
                                    <Text style={styles.infoTitle}>{details.name}</Text>
                                    <Text style={styles.infoSubtitle}>
                                        Investment details for this index
                                    </Text>
                                </View>

                                <View style={styles.infoBadge}>
                                    <Text style={styles.infoBadgeText}>
                                        {formatDailyReturn(effectiveDailyRate)}
                                    </Text>
                                </View>
                            </View>

                            <BenefitRow
                                icon="currency-inr"
                                title="Minimum investment"
                                text={`You can start investing in ${details.name} from ${formatCurrency(minimumTradeAmount)}.`}
                            />

                            <BenefitRow
                                icon="chart-line"
                                title="Investment range"
                                text={`${formatCurrency(minimumTradeAmount)} onwards, with no upper limit on the amount you invest.`}
                            />

                            <BenefitRow
                                icon="calendar-sync"
                                title="Lock and renewal cycle"
                                text={`Your investment stays locked for ${lockDays} days, then it becomes eligible for renewal or withdrawal.`}
                            />

                            <BenefitRow
                                icon="cash-fast"
                                title="Daily return"
                                text={`This index currently earns ${formatDailyReturn(effectiveDailyRate)} on your invested amount, credited every day.`}
                            />
                        </View>
                    </View>
                </ScrollView>
            )}

            <SafeAreaView edges={['bottom']} style={styles.bottomCtaWrap}>
                <TouchableOpacity
                    style={[styles.buyButton, loading && styles.buyButtonDisabled]}
                    activeOpacity={0.88}
                    onPress={handleBuyStock}
                    disabled={loading}
                >
                    <Icon name="cart-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.buyButtonText}>Buy Now</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    safeAreaTop: { backgroundColor: '#000000' },
    scrollContent: { paddingBottom: 120, flexGrow: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A',
        backgroundColor: '#000000',
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    updatingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
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
        color: '#00C896',
        fontSize: 10,
        fontWeight: '700',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },

    heroCard: {
        marginTop: 16,
        marginBottom: 12,
        backgroundColor: '#121212',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#222222',
        padding: 16,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    logoWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    topInfo: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    name: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 2,
    },
    symbol: {
        color: '#999999',
        fontSize: 12,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    category: {
        color: '#00C896',
        fontSize: 12,
        fontWeight: '700',
    },
    changeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 3,
        alignSelf: 'flex-start',
    },
    changeText: {
        fontSize: 10,
        fontWeight: '800',
    },

    price: {
        color: '#FFFFFF',
        fontWeight: '900',
        marginBottom: 12,
    },

    returnCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0D2B24',
        borderWidth: 1,
        borderColor: 'rgba(0, 200, 150, 0.25)',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 12,
    },
    returnLabel: {
        color: '#E2F4EF',
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 2,
    },
    returnSubLabel: {
        color: '#B9D9D3',
        fontSize: 10,
        fontWeight: '600',
    },
    returnValue: {
        color: '#00C896',
        fontSize: 14,
        fontWeight: '900',
    },

    compactStatsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
        marginBottom: 10,
    },
    miniStatCard: {
        paddingHorizontal: 4,
        marginBottom: 8,
    },
    miniStatLabel: {
        color: '#777777',
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 5,
    },
    miniStatValue: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#252525',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
    },

    compactMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    metaChip: {
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#242424',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    metaChipText: {
        color: '#B0B0B0',
        fontSize: 11,
        fontWeight: '700',
    },
    description: {
        color: '#9A9A9A',
        fontSize: 12,
        lineHeight: 18,
        marginTop: 6,
    },

    investmentInfoCard: {
        marginBottom: 20,
        backgroundColor: '#121212',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#222222',
        padding: 16,
    },
    infoHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    infoTitleWrap: {
        flex: 1,
        paddingRight: 10,
    },
    infoTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 4,
    },
    infoSubtitle: {
        color: '#888888',
        fontSize: 12,
        fontWeight: '600',
    },
    infoBadge: {
        backgroundColor: '#0D2B24',
        borderColor: 'rgba(0, 200, 150, 0.25)',
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    infoBadgeText: {
        color: '#00C896',
        fontSize: 11,
        fontWeight: '800',
    },

    benefitRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    benefitIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0D2B24',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    benefitContent: {
        flex: 1,
    },
    benefitTitle: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 3,
    },
    benefitText: {
        color: '#A8A8A8',
        fontSize: 12,
        lineHeight: 18,
    },

    bottomCtaWrap: {
        backgroundColor: '#000000',
        borderTopWidth: 1,
        borderTopColor: '#1A1A1A',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 12,
    },
    buyButton: {
        height: 52,
        borderRadius: 14,
        backgroundColor: '#00C896',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    buyButtonDisabled: {
        opacity: 0.6,
    },
    buyButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
});

export default StockDetailScreen;