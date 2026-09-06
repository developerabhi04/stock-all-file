import React, {
    useRef,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../../../services/ApiService';
import { SERVER_URL } from '../../../config/api.config';
import BannerSkeleton from './BannerSkeleton';

const HORIZONTAL_PADDING = 16;
const AUTO_SCROLL_MS = 4000;
const AUTO_REFRESH_INTERVAL_MS = 30000;

const FALLBACK_BANNERS = [
    {
        id: 'f1',
        type: 'static',
        icon: 'chart-line',
        eyebrow: 'INVEST',
        title: 'Start SIPs & Stocks',
        subtitle: 'Direct investing with zero commission',
        accent: '#00C896',
        cta: 'Explore',
    },
    {
        id: 'f2',
        type: 'static',
        icon: 'finance',
        eyebrow: 'TRADE',
        title: 'Trade F&O Smarter',
        subtitle: 'Fast execution, better visibility',
        accent: '#3B82F6',
        cta: 'Trade Now',
    },
    {
        id: 'f3',
        type: 'static',
        icon: 'gift-outline',
        eyebrow: 'REWARDS',
        title: 'Invite & Earn',
        subtitle: 'Refer friends and unlock bonus benefits',
        accent: '#F59E0B',
        cta: 'Refer Now',
    },
];

const BannerCarousel = ({ theme }) => {
    const { width } = useWindowDimensions();
    const flatListRef = useRef(null);
    const autoScrollRef = useRef(null);
    const refreshIntervalRef = useRef(null);

    const [activeSlide, setActiveSlide] = useState(0);
    const [banners, setBanners] = useState([]);
    const [loadingBanners, setLoadingBanners] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [backgroundUpdating, setBackgroundUpdating] = useState(false);

    const primaryColor = theme?.primary || '#00C896';

    const bannerWidth = useMemo(() => width - HORIZONTAL_PADDING * 2, [width]);

    const bannerHeight = useMemo(() => {
        if (width <= 360) return 148;
        if (width <= 420) return 160;
        return 172;
    }, [width]);

    const pageWidth = useMemo(() => width, [width]);

    const buildImageUrl = useCallback((imageUrl) => {
        if (!imageUrl || typeof imageUrl !== 'string') return '';

        const trimmed = imageUrl.trim();
        if (!trimmed) return '';

        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return trimmed;
        }

        return `${SERVER_URL.replace(/\/$/, '')}/${trimmed.replace(/^\//, '')}`;
    }, []);

    const scrollToSlide = useCallback(
        (index, animated = true) => {
            if (!flatListRef.current) return;

            flatListRef.current.scrollToOffset({
                offset: index * pageWidth,
                animated,
            });
        },
        [pageWidth]
    );

    const stopAutoScroll = useCallback(() => {
        if (autoScrollRef.current) {
            clearInterval(autoScrollRef.current);
            autoScrollRef.current = null;
        }
    }, []);

    const startAutoScroll = useCallback(
        (bannerCount) => {
            stopAutoScroll();

            if (bannerCount <= 1) return;

            autoScrollRef.current = setInterval(() => {
                setActiveSlide((prev) => {
                    const next = (prev + 1) % bannerCount;
                    scrollToSlide(next, true);
                    return next;
                });
            }, AUTO_SCROLL_MS);
        },
        [scrollToSlide, stopAutoScroll]
    );

    const stopRefreshInterval = useCallback(() => {
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }
    }, []);

    const normalizeBanners = useCallback(
        (rawList = []) => {
            const imageBanners = rawList
                .filter((b) => b?.imageUrl)
                .map((b, index) => ({
                    id: String(b?._id || b?.id || `banner-${index}`),
                    type: 'image',
                    imageUrl: buildImageUrl(b.imageUrl),
                    raw: b,
                }))
                .filter((b) => !!b.imageUrl);

            return imageBanners;
        },
        [buildImageUrl]
    );

    const applyBannerData = useCallback(
        (bannerItems = []) => {
            const finalBanners = bannerItems.length > 0 ? bannerItems : FALLBACK_BANNERS;

            setBanners(finalBanners);
            setActiveSlide((prev) => {
                const nextIndex = Math.min(prev, Math.max(finalBanners.length - 1, 0));
                requestAnimationFrame(() => {
                    scrollToSlide(nextIndex, false);
                });
                return nextIndex;
            });
        },
        [scrollToSlide]
    );

    const fetchBanners = useCallback(
        async ({ preferCache = true, backgroundRefresh = true, showLoader = false } = {}) => {
            try {
                if (showLoader) {
                    setLoadingBanners(true);
                } else {
                    setBackgroundUpdating(true);
                }

                const response = await ApiService.getBanners({
                    preferCache,
                    backgroundRefresh,
                });

                const bannerData = Array.isArray(response?.data) ? response.data : [];
                const normalized = normalizeBanners(bannerData);

                applyBannerData(normalized);
                setHasLoadedOnce(true);
            } catch (error) {
                console.error('❌ Banner fetch error:', error?.response?.data || error?.message || error);

                if (banners.length === 0) {
                    applyBannerData([]);
                }
            } finally {
                setLoadingBanners(false);
                setBackgroundUpdating(false);
            }
        },
        [normalizeBanners, applyBannerData, banners.length]
    );

    const refreshData = useCallback(
        async ({ preferCache = true, backgroundRefresh = true, silent = false } = {}) => {
            const shouldShowInitialLoader = !hasLoadedOnce && !silent && banners.length === 0;

            await fetchBanners({
                preferCache,
                backgroundRefresh,
                showLoader: shouldShowInitialLoader,
            });
        },
        [hasLoadedOnce, banners.length, fetchBanners]
    );

    useFocusEffect(
        useCallback(() => {
            refreshData({
                preferCache: true,
                backgroundRefresh: true,
                silent: false,
            });

            refreshIntervalRef.current = setInterval(() => {
                refreshData({
                    preferCache: true,
                    backgroundRefresh: true,
                    silent: true,
                });
            }, AUTO_REFRESH_INTERVAL_MS);

            return () => {
                stopRefreshInterval();
            };
        }, [refreshData, stopRefreshInterval])
    );

    useEffect(() => {
        if (banners.length > 1) {
            startAutoScroll(banners.length);
        } else {
            stopAutoScroll();
        }

        return () => {
            stopAutoScroll();
        };
    }, [banners.length, startAutoScroll, stopAutoScroll]);

    useEffect(() => {
        requestAnimationFrame(() => {
            scrollToSlide(activeSlide, false);
        });
    }, [pageWidth, activeSlide, scrollToSlide]);

    const onMomentumScrollEnd = (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / pageWidth);

        if (index >= 0 && index < banners.length) {
            setActiveSlide(index);
        }
    };

    const handleUserScrollBegin = () => {
        stopAutoScroll();
    };

    const handleUserScrollEnd = () => {
        if (banners.length > 1) {
            startAutoScroll(banners.length);
        }
    };

    const renderImageBanner = ({ item }) => (
        <View style={[styles.page, { width: pageWidth }]}>
            <View style={[styles.slide, { width: bannerWidth }]}>
                <View
                    style={[
                        styles.imageBannerCard,
                        {
                            height: bannerHeight,
                            backgroundColor: theme?.card || '#111315',
                            borderColor: theme?.border || '#1C1F24',
                        },
                    ]}
                >
                    <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.bannerImage}
                        resizeMode="cover"
                        onError={() => {
                            console.warn('⚠️ Banner image failed to load:', item.imageUrl);
                        }}
                    />

                    {backgroundUpdating ? (
                        <View style={styles.imageUpdatingBadge}>
                            <View style={[styles.updatingDot, { backgroundColor: primaryColor }]} />
                            <Text style={styles.imageUpdatingText}>Updating</Text>
                        </View>
                    ) : null}
                </View>
            </View>
        </View>
    );

    const renderStaticBanner = ({ item }) => (
        <View style={[styles.page, { width: pageWidth }]}>
            <View style={[styles.slide, { width: bannerWidth }]}>
                <View
                    style={[
                        styles.staticCard,
                        {
                            height: bannerHeight,
                            backgroundColor: theme?.card || '#111315',
                            borderColor: theme?.border || '#1C1F24',
                        },
                    ]}
                >
                    <View style={[styles.accentStrip, { backgroundColor: item.accent }]} />

                    <View style={styles.cardInner}>
                        <View style={styles.topRow}>
                            <View style={styles.leftCol}>
                                <View style={styles.eyebrowRow}>
                                    <View style={[styles.eyebrowDot, { backgroundColor: item.accent }]} />
                                    <Text style={[styles.eyebrowText, { color: item.accent }]}>
                                        {item.eyebrow}
                                    </Text>
                                </View>

                                <Text
                                    style={[styles.cardTitle, { color: theme?.text || '#FFFFFF' }]}
                                    numberOfLines={1}
                                >
                                    {item.title}
                                </Text>

                                <Text
                                    style={[styles.cardSubtitle, { color: theme?.textSecondary || '#999999' }]}
                                    numberOfLines={2}
                                >
                                    {item.subtitle}
                                </Text>
                            </View>

                            <View
                                style={[
                                    styles.iconWrap,
                                    {
                                        backgroundColor: `${item.accent}18`,
                                        borderColor: `${item.accent}30`,
                                    },
                                ]}
                            >
                                <Icon name={item.icon} size={22} color={item.accent} />
                            </View>
                        </View>

                        <View style={styles.bottomRow}>
                            <TouchableOpacity
                                style={[styles.ctaButton, { backgroundColor: item.accent }]}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.ctaText}>{item.cta}</Text>
                                <Icon name="arrow-right" size={14} color="#FFFFFF" />
                            </TouchableOpacity>

                            <View style={styles.hintRow}>
                                <Icon name="trending-up" size={13} color={theme?.textTertiary || '#666666'} />
                                <Text style={[styles.hintText, { color: theme?.textTertiary || '#666666' }]}>
                                    Track live
                                </Text>
                            </View>
                        </View>

                        {backgroundUpdating ? (
                            <View style={styles.staticUpdatingBadge}>
                                <View style={[styles.updatingDot, { backgroundColor: primaryColor }]} />
                                <Text style={[styles.staticUpdatingText, { color: primaryColor }]}>
                                    Updating
                                </Text>
                            </View>
                        ) : null}
                    </View>
                </View>
            </View>
        </View>
    );

    const renderBanner = ({ item }) => {
        if (item.type === 'image') {
            return renderImageBanner({ item });
        }
        return renderStaticBanner({ item });
    };

    if (loadingBanners) {
        return <BannerSkeleton theme={theme} bannerHeight={bannerHeight} />;
    }

    return (
        <View style={styles.bannerContainer}>
            <FlatList
                ref={flatListRef}
                data={banners}
                renderItem={renderBanner}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                decelerationRate="fast"
                snapToInterval={pageWidth}
                snapToAlignment="start"
                disableIntervalMomentum
                onMomentumScrollEnd={onMomentumScrollEnd}
                onScrollBeginDrag={handleUserScrollBegin}
                onScrollEndDrag={handleUserScrollEnd}
                getItemLayout={(_, index) => ({
                    length: pageWidth,
                    offset: pageWidth * index,
                    index,
                })}
            />

            {banners.length > 1 ? (
                <View style={styles.paginationContainer}>
                    {banners.map((_, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.dot,
                                idx === activeSlide
                                    ? [styles.dotActive, { backgroundColor: primaryColor }]
                                    : styles.dotInactive,
                            ]}
                        />
                    ))}
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    bannerContainer: {
        marginTop: 14,
        marginBottom: 18,
    },

    page: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    slide: {
        justifyContent: 'center',
        alignItems: 'center',
    },

    imageBannerCard: {
        width: '100%',
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
    },

    bannerImage: {
        width: '100%',
        height: '100%',
    },

    imageUpdatingBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },

    imageUpdatingText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        marginLeft: 6,
    },

    staticCard: {
        width: '100%',
        borderRadius: 18,
        borderWidth: 1,
        overflow: 'hidden',
    },

    accentStrip: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 4,
        zIndex: 1,
    },

    cardInner: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        paddingLeft: 20,
        justifyContent: 'space-between',
    },

    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },

    leftCol: {
        flex: 1,
        paddingRight: 12,
    },

    eyebrowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },

    eyebrowDot: {
        width: 6,
        height: 6,
        borderRadius: 999,
        marginRight: 6,
    },

    eyebrowText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 6,
        lineHeight: 22,
    },

    cardSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 17,
    },

    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        flexShrink: 0,
    },

    bottomRow: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 10,
        gap: 6,
    },

    ctaText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },

    hintRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    hintText: {
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 5,
    },

    staticUpdatingBadge: {
        position: 'absolute',
        top: 14,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },

    staticUpdatingText: {
        fontSize: 10,
        fontWeight: '700',
        marginLeft: 6,
    },

    updatingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },

    paginationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        gap: 6,
    },

    dot: {
        borderRadius: 999,
    },

    dotActive: {
        width: 18,
        height: 6,
    },

    dotInactive: {
        width: 6,
        height: 6,
        backgroundColor: '#2E3238',
    },
});

export default BannerCarousel;