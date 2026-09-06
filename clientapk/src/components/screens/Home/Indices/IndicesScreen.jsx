import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  FlatList,
  Image,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../../../../services/ApiService';
import { SERVER_URL } from '../../../../config/api.config';

const ALL_TAB = 'All Indices';
const AUTO_REFRESH_INTERVAL_MS = 30000;

const COLORS = {
  bg: '#000000',
  card: '#161616',
  cardAlt: '#1A1A1A',
  border: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#999999',
  textMuted: '#666666',
  primary: '#00C896',
  warning: '#FF9800',
  skeletonBase: '#1F1F1F',
  skeletonHighlight: '#2A2A2A',
  successBg: '#0D2B24',
  negativeBg: '#2A1F0D',
};

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
  const num = Number(value);
  return `${num}% / day`;
};

const resolveLogoUrl = (logoUrl) => {
  if (!logoUrl || typeof logoUrl !== 'string' || !logoUrl.trim()) return null;
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) return logoUrl;
  return `${SERVER_URL}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
};

const normalizeText = (value = '') => String(value).trim().toLowerCase();

const getCategoryIcon = (title = '') => {
  const text = normalizeText(title);

  if (text.includes('all')) return 'view-grid';
  if (text.includes('indian') || text.includes('india')) return 'flag';
  if (text.includes('global') || text.includes('international') || text.includes('world')) return 'earth';
  if (text.includes('crypto') || text.includes('bitcoin')) return 'bitcoin';
  if (text.includes('bank')) return 'bank';
  if (text.includes('it')) return 'laptop';
  return 'chart-line';
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

  const categoryTitle =
    item?.category?.title ||
    item?.category?.name ||
    item?.categoryName ||
    item?.category ||
    item?.type ||
    'Other';

  return {
    id: item?._id || item?.id || `index-${index}`,
    name: item?.name || 'Unnamed Index',
    symbol: item?.symbol || '',
    value: formatIndexValue(currentValue),
    rawValue: currentValue,
    previousClose,
    highValue,
    lowValue,
    change: formatChangePercent(changePercent),
    rawChangePercent: changePercent,
    rawChange: change,
    isPositive,
    categoryTitle,
    categorySlug: item?.category?.slug || item?.categorySlug || '',
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

const normalizeCategory = (item, index) => {
  const title =
    item?.title ||
    item?.name ||
    item?.categoryName ||
    `Category ${index + 1}`;

  return {
    id: item?._id || item?.id || `cat-${index}`,
    title,
    slug: item?.slug || '',
    icon: item?.icon || getCategoryIcon(title),
    raw: item,
  };
};

const ensureAllTab = (items = []) => {
  const hasAll = items.some(
    (item) => normalizeText(item.title) === normalizeText(ALL_TAB)
  );

  if (hasAll) return items;

  return [{ id: 'all-tab', title: ALL_TAB, slug: '', icon: 'view-grid' }, ...items];
};

const IndexLogo = ({ logoUrl, isPositive, size = 34, imageSize = 22, style }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isPositive ? COLORS.successBg : COLORS.negativeBg,
        },
        style,
      ]}
    >
      {logoUrl && !imgError ? (
        <Image
          source={{ uri: logoUrl }}
          style={{ width: imageSize, height: imageSize, borderRadius: 4 }}
          resizeMode="contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <Icon
          name={isPositive ? 'trending-up' : 'trending-down'}
          size={Math.max(16, imageSize - 2)}
          color={isPositive ? COLORS.primary : COLORS.warning}
        />
      )}
    </View>
  );
};

const ReturnBadge = ({ value, compact = false }) => {
  if (value === null || value === undefined) return null;

  return (
    <View style={[styles.returnBadge, compact && styles.returnBadgeCompact]}>
      <Icon name="cash-fast" size={compact ? 10 : 11} color={COLORS.primary} />
      <Text style={[styles.returnBadgeText, compact && styles.returnBadgeTextCompact]}>
        {formatDailyReturn(value)}
      </Text>
    </View>
  );
};

const SkeletonBlock = ({ width, height, radius = 10, style, animatedStyle }) => (
  <Animated.View
    style={[
      {
        width,
        height,
        borderRadius: radius,
        backgroundColor: COLORS.skeletonBase,
      },
      animatedStyle,
      style,
    ]}
  />
);

const FeaturedSkeleton = ({ animatedStyle }) => {
  return (
    <FlatList
      horizontal
      data={[1, 2, 3]}
      keyExtractor={(item) => `featured-skeleton-${item}`}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.featuredList}
      renderItem={() => (
        <View style={styles.featuredCard}>
          <View style={styles.featuredTopRow}>
            <SkeletonBlock width={40} height={40} radius={20} animatedStyle={animatedStyle} />
            <SkeletonBlock width={68} height={22} radius={8} animatedStyle={animatedStyle} />
          </View>

          <View style={styles.featuredBody}>
            <SkeletonBlock width="74%" height={13} radius={6} animatedStyle={animatedStyle} />
            <SkeletonBlock
              width="42%"
              height={10}
              radius={6}
              animatedStyle={animatedStyle}
              style={{ marginTop: 8 }}
            />
            <SkeletonBlock
              width="58%"
              height={20}
              radius={6}
              animatedStyle={animatedStyle}
              style={{ marginTop: 12 }}
            />
          </View>

          <SkeletonBlock width={72} height={24} radius={6} animatedStyle={animatedStyle} />
        </View>
      )}
    />
  );
};

const TabsSkeleton = ({ animatedStyle }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsContainer}
    >
      {[1, 2, 3, 4].map((item, index) => (
        <View
          key={`tab-skeleton-${item}`}
          style={[
            styles.tab,
            index === 0 && { width: 98 },
            index === 1 && { width: 118 },
            index === 2 && { width: 114 },
            index === 3 && { width: 86 },
          ]}
        >
          <SkeletonBlock width="70%" height={12} radius={6} animatedStyle={animatedStyle} />
        </View>
      ))}
    </ScrollView>
  );
};

const GridSkeleton = ({ animatedStyle }) => {
  return (
    <View style={styles.gridContainer}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <View key={`grid-skeleton-${item}`} style={styles.gridItemWrapper}>
          <View style={styles.indicesCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <SkeletonBlock
                  width={36}
                  height={36}
                  radius={18}
                  animatedStyle={animatedStyle}
                  style={styles.iconWrapper}
                />
                <View style={styles.cardInfo}>
                  <SkeletonBlock width="76%" height={12} radius={6} animatedStyle={animatedStyle} />
                  <SkeletonBlock
                    width="42%"
                    height={10}
                    radius={6}
                    animatedStyle={animatedStyle}
                    style={{ marginTop: 8 }}
                  />
                </View>
              </View>
            </View>

            <View style={styles.cardMiddle}>
              <SkeletonBlock width="58%" height={20} radius={6} animatedStyle={animatedStyle} />
              <SkeletonBlock
                width={70}
                height={22}
                radius={8}
                animatedStyle={animatedStyle}
                style={{ marginTop: 10 }}
              />
            </View>

            <View style={styles.cardFooter}>
              <SkeletonBlock width={64} height={22} radius={6} animatedStyle={animatedStyle} />
              <SkeletonBlock width={72} height={10} radius={6} animatedStyle={animatedStyle} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const IndicesScreen = forwardRef(({ navigation, route }, ref) => {
  const routeTab = route?.params?.tab;
  const initialTab = routeTab || ALL_TAB;

  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [categories, setCategories] = useState([]);
  const [featuredIndices, setFeaturedIndices] = useState([]);
  const [allIndices, setAllIndices] = useState([]);

  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingIndices, setLoadingIndices] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const [backgroundUpdating, setBackgroundUpdating] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loadError, setLoadError] = useState('');

  const scrollViewRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(0.45)).current;
  const intervalRef = useRef(null);

  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    },
  }));

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

  useEffect(() => {
    if (route?.params?.tab) {
      setSelectedTab(route.params.tab);
    }
  }, [route?.params?.tab]);

  const applyFeaturedResponse = useCallback((response) => {
    if (response?.success && Array.isArray(response?.data)) {
      setFeaturedIndices(response.data.map((item, index) => normalizeIndex(item, index)));
      return true;
    }
    return false;
  }, []);

  const applyCategoriesResponse = useCallback((response) => {
    if (response?.success && Array.isArray(response?.data)) {
      const normalized = response.data.map((item, index) => normalizeCategory(item, index));
      setCategories(ensureAllTab(normalized));
      return true;
    }

    setCategories(ensureAllTab([]));
    return false;
  }, []);

  const applyIndicesResponse = useCallback((response) => {
    if (response?.success && Array.isArray(response?.data)) {
      setAllIndices(response.data.map((item, index) => normalizeIndex(item, index)));
      return true;
    }
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

        const applied = applyFeaturedResponse(response);

        if (!applied && featuredIndices.length === 0) {
          setFeaturedIndices([]);
        }

        return applied;
      } catch (error) {
        console.error('❌ Featured indices fetch error:', error?.response?.data || error.message || error);
        if (featuredIndices.length === 0) {
          setFeaturedIndices([]);
        }
        return false;
      } finally {
        setLoadingFeatured(false);
      }
    },
    [applyFeaturedResponse, featuredIndices.length]
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

        applyCategoriesResponse(response);
        return true;
      } catch (error) {
        console.error('❌ Categories fetch error:', error?.response?.data || error.message || error);
        setCategories(ensureAllTab([]));
        return false;
      } finally {
        setLoadingCategories(false);
      }
    },
    [applyCategoriesResponse]
  );

  const fetchAllIndices = useCallback(
    async ({ preferCache = true, backgroundRefresh = true, showLoader = false } = {}) => {
      try {
        if (showLoader) {
          setLoadingIndices(true);
        }

        const response = await ApiService.getMarketIndices(
          {},
          {
            preferCache,
            backgroundRefresh,
          }
        );

        const applied = applyIndicesResponse(response);

        if (!applied && allIndices.length === 0) {
          setAllIndices([]);
          setLoadError(response?.message || 'Unable to load market indices right now.');
        } else {
          setLoadError('');
        }

        return applied;
      } catch (error) {
        console.error('❌ Market indices fetch error:', error?.response?.data || error.message || error);

        if (allIndices.length === 0) {
          setAllIndices([]);
          setLoadError('Unable to load market indices right now.');
        }

        return false;
      } finally {
        setLoadingIndices(false);
      }
    },
    [allIndices.length, applyIndicesResponse]
  );

  const fetchInitialData = useCallback(
    async ({
      preferCache = true,
      backgroundRefresh = true,
      forceRefresh = false,
      silent = false,
    } = {}) => {
      const showInitialSkeleton = !hasLoadedOnce && !silent;

      try {
        if (forceRefresh) {
          setRefreshing(true);
        } else if (!showInitialSkeleton) {
          setBackgroundUpdating(true);
        }

        if (showInitialSkeleton) {
          setLoadingFeatured(true);
          setLoadingCategories(true);
          setLoadingIndices(true);
        }

        await Promise.all([
          fetchFeaturedIndices({
            preferCache,
            backgroundRefresh,
            showLoader: showInitialSkeleton,
          }),
          fetchCategories({
            preferCache,
            backgroundRefresh,
            showLoader: showInitialSkeleton,
          }),
          fetchAllIndices({
            preferCache,
            backgroundRefresh,
            showLoader: showInitialSkeleton,
          }),
        ]);

        setHasLoadedOnce(true);
      } catch (error) {
        console.error('❌ Initial indices screen fetch error:', error?.message || error);
      } finally {
        setRefreshing(false);
        setBackgroundUpdating(false);
      }
    },
    [
      hasLoadedOnce,
      fetchFeaturedIndices,
      fetchCategories,
      fetchAllIndices,
    ]
  );

  useFocusEffect(
    useCallback(() => {
      fetchInitialData({
        preferCache: true,
        backgroundRefresh: true,
        forceRefresh: false,
        silent: false,
      });

      intervalRef.current = setInterval(() => {
        fetchInitialData({
          preferCache: true,
          backgroundRefresh: true,
          forceRefresh: false,
          silent: true,
        });
      }, AUTO_REFRESH_INTERVAL_MS);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [fetchInitialData])
  );

  const handleRefresh = useCallback(() => {
    fetchInitialData({
      preferCache: false,
      backgroundRefresh: false,
      forceRefresh: true,
      silent: false,
    });
  }, [fetchInitialData]);

  const filteredIndices = useMemo(() => {
    if (normalizeText(selectedTab) === normalizeText(ALL_TAB)) {
      return allIndices;
    }

    const selected = normalizeText(selectedTab);

    return allIndices.filter((item) => {
      const titleMatch = normalizeText(item.categoryTitle) === selected;
      const slugMatch = normalizeText(item.categorySlug) === selected;
      return titleMatch || slugMatch;
    });
  }, [allIndices, selectedTab]);

  const handleOpenDetail = useCallback(
    (item) => {
      navigation.navigate('StockDetail', {
        stock: {
          id: item.id,
          name: item.name,
          symbol: item.symbol,
          ticker: item.symbol,
          currentValue: item.rawValue,
          price: item.rawValue,
          rawValue: item.rawValue,
          previousClose: item.previousClose,
          highValue: item.highValue,
          lowValue: item.lowValue,
          change: item.change,
          rawChangePercent: item.rawChangePercent,
          rawChange: item.rawChange,
          isPositive: item.isPositive,
          categoryTitle: item.categoryTitle,
          logoUrl: item.logoUrl,
          defaultDailyRate: item.defaultDailyRate,
          description: item.description,
          type: item.type || 'Index',
        },
      });
    },
    [navigation]
  );

  const renderFeaturedItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={() => handleOpenDetail(item)}
        activeOpacity={0.85}
      >
        <View style={styles.featuredTopRow}>
          <IndexLogo
            logoUrl={item.logoUrl}
            isPositive={item.isPositive}
            size={40}
            imageSize={24}
            style={styles.featuredIcon}
          />
          <ReturnBadge value={item.defaultDailyRate} compact />
        </View>

        <View style={styles.featuredBody}>
          <Text style={styles.featuredName} numberOfLines={1}>
            {item.name}
          </Text>

          {!!item.symbol && (
            <Text style={styles.featuredSymbol} numberOfLines={1}>
              {item.symbol}
            </Text>
          )}

          <Text style={styles.featuredValue}>₹ {item.value}</Text>
        </View>

        <View
          style={[
            styles.featuredChange,
            { backgroundColor: item.isPositive ? COLORS.successBg : COLORS.negativeBg },
          ]}
        >
          <Icon
            name={item.isPositive ? 'arrow-up' : 'arrow-down'}
            size={10}
            color={item.isPositive ? COLORS.primary : COLORS.warning}
          />
          <Text
            style={[
              styles.featuredChangeText,
              { color: item.isPositive ? COLORS.primary : COLORS.warning },
            ]}
          >
            {item.change}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [handleOpenDetail]
  );

  const renderIndicesItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.indicesCard}
        activeOpacity={0.85}
        onPress={() => handleOpenDetail(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <IndexLogo
              logoUrl={item.logoUrl}
              isPositive={item.isPositive}
              size={36}
              imageSize={20}
              style={styles.iconWrapper}
            />

            <View style={styles.cardInfo}>
              <Text style={styles.indicesName} numberOfLines={1}>
                {item.name}
              </Text>
              {!!item.symbol && <Text style={styles.indicesSymbol}>{item.symbol}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.cardMiddle}>
          <Text style={styles.indicesValue}>₹ {item.value}</Text>
          <ReturnBadge value={item.defaultDailyRate} compact />
        </View>

        <View style={styles.cardFooter}>
          <View
            style={[
              styles.indicesChange,
              { backgroundColor: item.isPositive ? COLORS.successBg : COLORS.negativeBg },
            ]}
          >
            <Icon
              name={item.isPositive ? 'arrow-up' : 'arrow-down'}
              size={10}
              color={item.isPositive ? COLORS.primary : COLORS.warning}
            />
            <Text
              style={[
                styles.indicesChangeText,
                { color: item.isPositive ? COLORS.primary : COLORS.warning },
              ]}
            >
              {item.change}
            </Text>
          </View>

          <Text style={styles.tapHint}>Tap for details</Text>
        </View>
      </TouchableOpacity>
    ),
    [handleOpenDetail]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Market Indices</Text>

          <View style={styles.headerActions}>
            {backgroundUpdating ? (
              <View style={styles.updatingBadge}>
                <View style={styles.updatingDot} />
                <Text style={styles.updatingText}>Updating...</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.searchButton} onPress={handleRefresh}>
              <Icon name="refresh" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.featuredSection}>
          <View style={styles.featuredSectionHeader}>
            <Text style={styles.featuredSectionTitle}>Top Indices</Text>
            <Icon name="chart-timeline-variant" size={18} color={COLORS.primary} />
          </View>

          {loadingFeatured ? (
            <FeaturedSkeleton animatedStyle={skeletonAnimatedStyle} />
          ) : (
            <FlatList
              horizontal
              data={featuredIndices}
              renderItem={renderFeaturedItem}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            />
          )}
        </View>

        <View style={styles.tabsSection}>
          {loadingCategories ? (
            <TabsSkeleton animatedStyle={skeletonAnimatedStyle} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContainer}
            >
              {categories.map((tab, index) => (
                <TouchableOpacity
                  key={tab.id || `tab-${index}`}
                  style={[styles.tab, selectedTab === tab.title && styles.tabActive]}
                  onPress={() => setSelectedTab(tab.title)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedTab === tab.title && styles.tabTextActive,
                    ]}
                  >
                    {tab.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.allIndicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedTab === ALL_TAB ? 'All Markets' : selectedTab}
            </Text>
            <Text style={styles.sectionCount}>
              {filteredIndices.length} {normalizeText(selectedTab) === 'crypto' ? 'Coins' : 'Indices'}
            </Text>
          </View>

          {loadingIndices ? (
            <GridSkeleton animatedStyle={skeletonAnimatedStyle} />
          ) : filteredIndices.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Icon name="database-off-outline" size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No data found</Text>
              <Text style={styles.emptyText}>
                {loadError || `No indices available for ${selectedTab}.`}
              </Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredIndices.map((item) => (
                <View key={item.id} style={styles.gridItemWrapper}>
                  {renderIndicesItem({ item })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
});

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
    paddingVertical: 12,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardAlt,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
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
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  updatingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  updatingText: {
    fontSize: 10,
    color: COLORS.text,
    fontWeight: '700',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  featuredSection: {
    paddingVertical: 16,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardAlt,
  },
  featuredSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  featuredSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  featuredList: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  featuredCard: {
    width: 156,
    minHeight: 170,
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
  },
  featuredTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  featuredIcon: {
    marginBottom: 0,
  },
  featuredBody: {
    flex: 1,
    justifyContent: 'center',
  },
  featuredName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 3,
  },
  featuredSymbol: {
    fontSize: 10,
    color: '#7A7A7A',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  featuredValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },
  featuredChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
    alignSelf: 'flex-start',
  },
  featuredChangeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  tabsSection: {
    backgroundColor: COLORS.bg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardAlt,
  },
  tabsContainer: {
    paddingHorizontal: 16,
  },
  tab: {
    minWidth: 84,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.cardAlt,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.successBg,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  tabTextActive: {
    color: COLORS.primary,
  },

  allIndicesSection: {
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: COLORS.bg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  gridItemWrapper: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  indicesCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 138,
    justifyContent: 'space-between',
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    marginRight: 10,
  },
  cardInfo: {
    flex: 1,
  },
  indicesName: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '800',
    marginBottom: 2,
  },
  indicesSymbol: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  cardMiddle: {
    marginBottom: 12,
  },
  indicesValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicesChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  indicesChangeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tapHint: {
    fontSize: 10,
    color: '#5F5F5F',
    fontWeight: '600',
  },

  returnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 150, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  returnBadgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  returnBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
  },
  returnBadgeTextCompact: {
    fontSize: 9,
  },

  emptyWrap: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default IndicesScreen;