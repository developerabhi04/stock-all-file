import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Modal,
    Animated,
    Alert,
    ScrollView,
    useWindowDimensions,
    PixelRatio,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ApiService from '../../../../services/ApiService';
import AuthStorage from '../../../../services/AuthStorage';
import BuyStockContent from './BuyStockContent';

const COLORS = {
    background: '#000000',
    surface: '#101010',
    surface2: '#171717',
    surface3: '#1D1D1D',
    card: '#141414',
    text: '#FFFFFF',
    textSecondary: '#A3A3A3',
    textMuted: '#6F6F6F',
    border: '#242424',
    primary: '#00C896',
    primaryLight: 'rgba(0, 200, 150, 0.14)',
    success: '#00C896',
    successLight: 'rgba(0, 200, 150, 0.14)',
    error: '#FF5252',
    errorLight: 'rgba(255, 82, 82, 0.14)',
    warning: '#FFB020',
    warningLight: 'rgba(255, 176, 32, 0.14)',
    overlay: 'rgba(0, 0, 0, 0.86)',
    white: '#FFFFFF',
};

const DEFAULT_MIN_INVESTMENT = 5000;
const BASE_WIDTH = 375;

const BuyStockScreen = ({ navigation, route }) => {
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

    const scale = useCallback(
        (size) => {
            const ratio = SCREEN_WIDTH / BASE_WIDTH;
            const clampedRatio = Math.min(Math.max(ratio, 0.85), 1.25);
            return Math.round(PixelRatio.roundToNearestPixel(size * clampedRatio));
        },
        [SCREEN_WIDTH]
    );

    const isSmallDevice = SCREEN_WIDTH < 360;

    const parseNumber = useCallback((value) => {
        if (value === null || value === undefined || value === '') return 0;
        const cleaned = String(value).replace(/,/g, '').trim();
        const parsed = parseFloat(cleaned);
        return Number.isNaN(parsed) ? 0 : parsed;
    }, []);

    const getPositiveNumber = useCallback(
        (...values) => {
            for (const value of values) {
                const num = Number(value);
                if (!Number.isNaN(num) && num > 0) {
                    return num;
                }
            }
            return 0;
        },
        []
    );

    const routeIndexId = route?.params?.indexId || null;
    const routeIndexName = route?.params?.indexName || '';
    const routeIndexSymbol = route?.params?.indexSymbol || '';
    const reinvestFromInvestmentId = route?.params?.reinvestFromInvestmentId || null;
    const suggestedAmount = route?.params?.suggestedAmount || '';

    const routeStock = route?.params?.stock || {
        _id: routeIndexId,
        id: routeIndexId,
        name: routeIndexName || 'NIFTY 50',
        symbol: routeIndexSymbol || 'NIFTY50',
        value: '25597.65',
        change: '-0.64%',
        isPositive: false,
        logoUrl: '',
        defaultDailyRate: 0,
        minimumInvestment: DEFAULT_MIN_INVESTMENT,
    };

    const routeMinimumTradeAmount = getPositiveNumber(
        route?.params?.minimumTradeAmount,
        route?.params?.minimumInvestment,
        routeStock?.minimumInvestment,
        routeStock?.minInvestment,
        DEFAULT_MIN_INVESTMENT
    );

    const [priceLimit, setPriceLimit] = useState(
        suggestedAmount ? String(Math.floor(Number(suggestedAmount))) : ''
    );
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [orderId, setOrderId] = useState('');

    const [stockData, setStockData] = useState(routeStock);
    const [loadingStock, setLoadingStock] = useState(false);
    const [stockError, setStockError] = useState('');
    const [placingOrder, setPlacingOrder] = useState(false);

    const [userData, setUserData] = useState(null);
    const [loadingWallet, setLoadingWallet] = useState(true);
    const [walletError, setWalletError] = useState('');

    const [previewData, setPreviewData] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [previewError, setPreviewError] = useState('');

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const successScaleAnim = useRef(new Animated.Value(0)).current;
    const checkmarkAnim = useRef(new Animated.Value(0)).current;
    const previewTimeoutRef = useRef(null);
    const activePreviewRequestRef = useRef(0);

    const formatCurrency = (value) => {
        const num = typeof value === 'number' ? value : parseNumber(value);
        return num.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatCompactCurrency = (value) => {
        const num = typeof value === 'number' ? value : parseNumber(value);
        return num.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
        });
    };

    const normalizeStockResponse = useCallback(
        (item = {}) => {
            const currentValue =
                item?.currentValue ??
                item?.currentPrice ??
                item?.livePrice ??
                item?.marketPrice ??
                item?.ltp ??
                item?.lastPrice ??
                item?.indexValue ??
                item?.closePrice ??
                item?.price ??
                item?.value ??
                item?.indexSnapshot?.currentValue ??
                item?.indexSnapshot?.currentPrice ??
                item?.indexSnapshot?.livePrice ??
                item?.indexSnapshot?.marketPrice ??
                item?.indexSnapshot?.ltp ??
                routeStock?.currentValue ??
                routeStock?.currentPrice ??
                routeStock?.livePrice ??
                routeStock?.marketPrice ??
                routeStock?.ltp ??
                routeStock?.lastPrice ??
                routeStock?.price ??
                routeStock?.value ??
                '';

            const changePercent =
                item?.changePercent ??
                item?.change ??
                routeStock?.rawChangePercent ??
                routeStock?.change ??
                0;

            const numericChangePercent =
                typeof changePercent === 'string'
                    ? parseFloat(String(changePercent).replace('%', ''))
                    : Number(changePercent || 0);

            const normalizedDailyRate =
                item?.defaultDailyRate ??
                item?.dailyRate ??
                item?.dailyReturnRate ??
                item?.dailyInterestRate ??
                routeStock?.defaultDailyRate ??
                routeStock?.dailyRate ??
                0;

            const normalizedMinimumInvestment = getPositiveNumber(
                item?.minimumInvestment,
                item?.minInvestment,
                item?.minimumTradeAmount,
                routeStock?.minimumInvestment,
                routeStock?.minInvestment,
                route?.params?.minimumTradeAmount,
                DEFAULT_MIN_INVESTMENT
            );

            const normalizedLockPeriodDays = getPositiveNumber(
                item?.lockPeriodDays,
                item?.lockDays,
                item?.lockInDays,
                item?.lockInPeriod,
                item?.indexSnapshot?.lockPeriodDays,
                routeStock?.lockPeriodDays,
                routeStock?.lockDays,
                route?.params?.lockPeriodDays
            ); // no DEFAULT fallback — 0 means backend hasn't provided it yet

            return {
                id:
                    item?._id ||
                    item?.id ||
                    routeStock?.id ||
                    routeStock?._id ||
                    routeStock?.symbol ||
                    'stock-1',
                name: item?.name || routeStock?.name || 'Unknown Stock',
                symbol: item?.symbol || routeStock?.symbol || '',
                value: String(currentValue),
                currentValue: parseNumber(currentValue),
                change:
                    typeof changePercent === 'string'
                        ? changePercent
                        : `${numericChangePercent >= 0 ? '+' : ''}${numericChangePercent.toFixed(2)}%`,
                changePercent: numericChangePercent,
                isPositive:
                    typeof item?.isPositive === 'boolean'
                        ? item.isPositive
                        : typeof routeStock?.isPositive === 'boolean'
                            ? routeStock.isPositive
                            : numericChangePercent >= 0,
                logoUrl: item?.logoUrl || routeStock?.logoUrl || '',
                defaultDailyRate: parseNumber(normalizedDailyRate),
                dailyRate: parseNumber(normalizedDailyRate),
                minimumInvestment: normalizedMinimumInvestment,
                minimumTradeAmount: normalizedMinimumInvestment,
                lockPeriodDays: normalizedLockPeriodDays
            };
        },
        [DEFAULT_MIN_INVESTMENT, getPositiveNumber, parseNumber, route?.params?.minimumTradeAmount, routeStock]
    );

    const fetchUserProfile = async () => {
        try {
            setLoadingWallet(true);
            setWalletError('');

            const response = await ApiService.getUserProfile();

            if (response?.success && response?.data) {
                setUserData(response.data);
                return;
            }

            const cachedUser = await AuthStorage.getUser();
            if (cachedUser) {
                setUserData(cachedUser);
            } else {
                setWalletError('Unable to fetch wallet balance.');
            }
        } catch (error) {
            console.error('Error fetching profile in BuyStockScreen:', error);

            const cachedUser = await AuthStorage.getUser();
            if (cachedUser) {
                setUserData(cachedUser);
            } else {
                setWalletError('Unable to fetch wallet balance.');
            }
        } finally {
            setLoadingWallet(false);
        }
    };

    const fetchStockDetails = async () => {
        try {
            setLoadingStock(true);
            setStockError('');

            let response = null;

            const stockId =
                route?.params?.indexId ||
                routeStock?.id ||
                routeStock?._id ||
                stockData?.id ||
                null;

            const symbol =
                route?.params?.indexSymbol ||
                routeStock?.symbol ||
                stockData?.symbol ||
                route?.params?.indexName ||
                routeStock?.name ||
                stockData?.name ||
                '';

            if (typeof ApiService.getIndexById === 'function' && stockId) {
                response = await ApiService.getIndexById(stockId);
            } else if (typeof ApiService.getIndexBySymbol === 'function' && symbol) {
                response = await ApiService.getIndexBySymbol(symbol);
            } else if (typeof ApiService.getStockDetails === 'function' && symbol) {
                response = await ApiService.getStockDetails(symbol);
            } else if (typeof ApiService.getMarketIndexDetails === 'function' && symbol) {
                response = await ApiService.getMarketIndexDetails(symbol);
            }

            if (response?.success && response?.data) {
                const rawData = Array.isArray(response.data) ? response.data[0] : response.data;
                const mergedData = {
                    ...routeStock,
                    ...rawData,
                };
                setStockData(normalizeStockResponse(mergedData));
                return;
            }

            setStockData(normalizeStockResponse(routeStock));
        } catch (error) {
            console.error('Stock details fetch error:', error);
            setStockError('Unable to fetch latest index data.');
            setStockData(normalizeStockResponse(routeStock));
        } finally {
            setLoadingStock(false);
        }
    };

    const fetchInvestmentPreview = useCallback(
        async (amount, indexId) => {
            if (!amount || !indexId) {
                setPreviewData(null);
                setPreviewError('');
                return;
            }

            const requestId = Date.now();
            activePreviewRequestRef.current = requestId;

            try {
                setLoadingPreview(true);
                setPreviewError('');

                let response = null;

                if (typeof ApiService.getInvestmentPreview === 'function') {
                    response = await ApiService.getInvestmentPreview({ indexId, amount });
                } else if (typeof ApiService.previewInvestmentOrder === 'function') {
                    response = await ApiService.previewInvestmentOrder({ indexId, amount });
                } else if (typeof ApiService.previewOrder === 'function') {
                    response = await ApiService.previewOrder({ indexId, amount });
                } else {
                    setPreviewData(null);
                    setPreviewError('');
                    return;
                }

                if (activePreviewRequestRef.current !== requestId) return;

                if (!response?.success) {
                    throw new Error(response?.message || 'Unable to calculate investment preview');
                }

                const rawPreview = response?.data || {};

                const normalizedPreview = {
                    ...rawPreview,
                    minimumInvestment: getPositiveNumber(
                        rawPreview?.minimumInvestment,
                        rawPreview?.minInvestment,
                        rawPreview?.minimumTradeAmount,
                        rawPreview?.indexSnapshot?.minimumInvestment,
                        stockData?.minimumInvestment,
                        routeMinimumTradeAmount,
                        DEFAULT_MIN_INVESTMENT
                    ),
                };

                setPreviewData(normalizedPreview);
            } catch (error) {
                if (activePreviewRequestRef.current !== requestId) return;
                console.error('Investment preview error:', error);
                setPreviewData(null);
                setPreviewError(error?.message || 'Unable to calculate investment preview.');
            } finally {
                if (activePreviewRequestRef.current === requestId) {
                    setLoadingPreview(false);
                }
            }
        },
        [DEFAULT_MIN_INVESTMENT, getPositiveNumber, routeMinimumTradeAmount, stockData?.minimumInvestment]
    );

    useFocusEffect(
        useCallback(() => {
            fetchUserProfile();
            fetchStockDetails();
        }, [routeStock?.symbol, routeStock?.id])
    );

    const handleAmountChange = (value) => {
        let sanitized = value.replace(/[^0-9.]/g, '');

        const parts = sanitized.split('.');
        if (parts.length > 2) {
            sanitized = `${parts[0]}.${parts.slice(1).join('')}`;
        }

        if (sanitized.includes('.')) {
            const [whole, decimal] = sanitized.split('.');
            sanitized = `${whole}.${(decimal || '').slice(0, 2)}`;
        }

        setPriceLimit(sanitized);
    };

    const handleClear = () => {
        setPriceLimit('');
        setPreviewData(null);
        setPreviewError('');
    };

    const walletBalance = Number(userData?.walletBalance || 0);

    const minimumTradeAmount = useMemo(() => {
        return getPositiveNumber(
            previewData?.minimumInvestment,
            previewData?.minInvestment,
            previewData?.minimumTradeAmount,
            previewData?.indexSnapshot?.minimumInvestment,
            stockData?.minimumInvestment,
            stockData?.minimumTradeAmount,
            route?.params?.minimumTradeAmount,
            route?.params?.minimumInvestment,
            route?.params?.stock?.minimumInvestment,
            route?.params?.stock?.minInvestment,
            routeMinimumTradeAmount,
            DEFAULT_MIN_INVESTMENT
        );
    }, [
        DEFAULT_MIN_INVESTMENT,
        getPositiveNumber,
        previewData,
        route?.params?.minimumInvestment,
        route?.params?.minimumTradeAmount,
        route?.params?.stock?.minInvestment,
        route?.params?.stock?.minimumInvestment,
        routeMinimumTradeAmount,
        stockData?.minimumInvestment,
        stockData?.minimumTradeAmount,
    ]);


    const lockPeriodDays = useMemo(() => {
        return getPositiveNumber(
            previewData?.lockPeriodDays,
            previewData?.lockDays,
            previewData?.lockInDays,
            previewData?.lockInPeriod,
            previewData?.indexSnapshot?.lockPeriodDays,
            previewData?.indexSnapshot?.lockDays,
            stockData?.lockPeriodDays,
            stockData?.lockDays,
            route?.params?.lockPeriodDays
        );
    }, [
        getPositiveNumber,
        previewData?.lockPeriodDays,
        previewData?.lockDays,
        previewData?.lockInDays,
        previewData?.lockInPeriod,
        previewData?.indexSnapshot?.lockPeriodDays,
        previewData?.indexSnapshot?.lockDays,
        stockData?.lockPeriodDays,
        stockData?.lockDays,
        route?.params?.lockPeriodDays,
    ]);
    const activeIndexId =
        stockData?.id ||
        route?.params?.indexId ||
        routeStock?.id ||
        routeStock?._id ||
        null;

    const enteredAmount = parseFloat(priceLimit) || 0;
    const stockPrice = parseNumber(
        previewData?.indexSnapshot?.currentValue ??
        previewData?.indexSnapshot?.currentPrice ??
        previewData?.indexSnapshot?.livePrice ??
        previewData?.indexSnapshot?.marketPrice ??
        previewData?.indexSnapshot?.ltp ??
        previewData?.indexSnapshot?.lastPrice ??
        previewData?.currentValue ??
        previewData?.currentPrice ??
        previewData?.livePrice ??
        stockData?.currentValue ??
        stockData?.currentPrice ??
        stockData?.livePrice ??
        stockData?.marketPrice ??
        stockData?.ltp ??
        stockData?.lastPrice ??
        stockData?.price ??
        stockData?.value
    );

    const estimatedCharges = 0;
    const totalPayable = enteredAmount + estimatedCharges;

    const effectiveDailyRate = Number(
        previewData?.effectiveDailyRate ??
        previewData?.dailyRate ??
        previewData?.rate ??
        stockData?.defaultDailyRate ??
        stockData?.dailyRate ??
        0
    );

    const perDayReturn = Number(
        previewData?.dailyInterestAmount ??
        previewData?.perDayReturn ??
        previewData?.dailyEarning ??
        previewData?.dailyReturnAmount ??
        previewData?.perDayInterest ??
        (enteredAmount > 0 && effectiveDailyRate > 0
            ? (enteredAmount * effectiveDailyRate) / 100
            : 0)
    );

    const backend30DayEstimate = Number(
        previewData?.total30DaysEstimate ??
        previewData?.estimated30DayReturn ??
        previewData?.estimated30DaysReturn ??
        0
    );

    const total30DayEstimate =
        backend30DayEstimate > 0
            ? backend30DayEstimate
            : perDayReturn > 0 && lockPeriodDays > 0
                ? perDayReturn * lockPeriodDays   // ← correct now
                : 0;

    const dailyRateLabel =
        effectiveDailyRate > 0
            ? `${effectiveDailyRate}% daily return`
            : 'Daily return will be confirmed after preview';

    const isBelowMinimum = enteredAmount > 0 && enteredAmount < minimumTradeAmount;

    const exceedsBalance =
        previewData && typeof previewData?.hasSufficientBalance === 'boolean'
            ? !previewData.hasSufficientBalance
            : totalPayable > walletBalance;

    const canTrade =
        !loadingWallet &&
        !loadingPreview &&
        enteredAmount >= minimumTradeAmount &&
        walletBalance > 0 &&
        !exceedsBalance &&
        !placingOrder &&
        !!activeIndexId;

    const marketStatus =
        loadingStock || loadingWallet
            ? 'Updating'
            : loadingPreview
                ? 'Previewing'
                : 'Live';

    useEffect(() => {
        if (previewTimeoutRef.current) {
            clearTimeout(previewTimeoutRef.current);
        }

        if (!activeIndexId || !enteredAmount) {
            setPreviewData(null);
            setPreviewError('');
            setLoadingPreview(false);
            return;
        }

        if (enteredAmount < minimumTradeAmount) {
            setPreviewData(null);
            setPreviewError('');
            setLoadingPreview(false);
            return;
        }

        previewTimeoutRef.current = setTimeout(() => {
            fetchInvestmentPreview(enteredAmount, activeIndexId);
        }, 450);

        return () => {
            if (previewTimeoutRef.current) {
                clearTimeout(previewTimeoutRef.current);
            }
        };
    }, [enteredAmount, activeIndexId, minimumTradeAmount, walletBalance, fetchInvestmentPreview]);

    const statusTone = useMemo(() => {
        if (loadingWallet) {
            return { color: COLORS.warning, bg: COLORS.warningLight, text: 'Fetching wallet balance...' };
        }
        if (walletError) {
            return { color: COLORS.error, bg: COLORS.errorLight, text: walletError };
        }
        if (isBelowMinimum) {
            return {
                color: COLORS.warning,
                bg: COLORS.warningLight,
                text: `Minimum investment amount is ₹${minimumTradeAmount.toLocaleString('en-IN')}`,
            };
        }
        if (exceedsBalance) {
            return {
                color: COLORS.error,
                bg: COLORS.errorLight,
                text: 'Wallet balance is lower than entered amount',
            };
        }
        if (loadingPreview) {
            return {
                color: COLORS.warning,
                bg: COLORS.warningLight,
                text: 'Calculating daily earning preview...',
            };
        }
        if (previewError) {
            return { color: COLORS.error, bg: COLORS.errorLight, text: previewError };
        }
        if (canTrade) {
            return {
                color: COLORS.success,
                bg: COLORS.successLight,
                text: 'Investment is ready. Wallet will be deducted instantly and the investment will become active immediately.',
            };
        }
        return {
            color: COLORS.textSecondary,
            bg: COLORS.surface2,
            text: 'Enter your investment amount to continue',
        };
    }, [
        loadingWallet,
        walletError,
        isBelowMinimum,
        exceedsBalance,
        loadingPreview,
        previewError,
        canTrade,
        minimumTradeAmount,
    ]);

    const openConfirmModal = () => {
        if (!canTrade || placingOrder || loadingWallet || loadingPreview) return;
        scaleAnim.setValue(0);
        setShowConfirmModal(true);
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
        }).start();
    };

    const closeConfirmModal = () => {
        Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setShowConfirmModal(false));
    };

    const closeSuccessModal = () => {
        Animated.timing(successScaleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setShowSuccessModal(false);
            checkmarkAnim.setValue(0);

            navigation.navigate('Home', {
                screen: 'Portfolio',
            });
        });
    };

    const handleFinalConfirm = async () => {
        try {
            setPlacingOrder(true);

            const payload = {
                indexId: activeIndexId,
                amount: enteredAmount,
                ...(reinvestFromInvestmentId ? { reinvestFromInvestmentId } : {}),
            };

            let response = null;

            if (typeof ApiService.placeInvestmentOrder === 'function') {
                response = await ApiService.placeInvestmentOrder(payload);
            } else if (typeof ApiService.createInvestmentOrder === 'function') {
                response = await ApiService.createInvestmentOrder(payload);
            } else if (typeof ApiService.placeOrder === 'function') {
                response = await ApiService.placeOrder(payload);
            } else {
                throw new Error('Investment order API method is missing in ApiService');
            }

            if (!response?.success) {
                throw new Error(response?.message || 'Failed to place investment order');
            }

            const responseData = response?.data || {};
            const responseOrder = responseData?.order || responseData?.investment || responseData;

            const newOrderId =
                responseOrder?._id ||
                responseData?.orderId ||
                responseData?._id ||
                `ORD${Date.now()}${Math.floor(Math.random() * 10000)}`;

            setOrderId(newOrderId);

            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }).start(() => {
                setShowConfirmModal(false);
                successScaleAnim.setValue(0);
                checkmarkAnim.setValue(0);
                setShowSuccessModal(true);

                Animated.sequence([
                    Animated.spring(successScaleAnim, {
                        toValue: 1,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 7,
                    }),
                    Animated.spring(checkmarkAnim, {
                        toValue: 1,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 7,
                    }),
                ]).start();
            });

            await fetchUserProfile();
        } catch (error) {
            console.error('Place order error:', error);
            Alert.alert('Error', error?.message || 'Failed to place order. Please try again.');
        } finally {
            setPlacingOrder(false);
        }
    };

    const styles = useMemo(
        () => createStyles(scale, SCREEN_HEIGHT, isSmallDevice),
        [scale, SCREEN_HEIGHT, isSmallDevice]
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            <SafeAreaView edges={['top']} style={styles.safeAreaHeader}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() =>
                            navigation.navigate('Home', {
                                screen: 'Portfolio',
                            })
                        }
                        activeOpacity={0.7}
                    >
                        <Icon name="arrow-left" size={scale(20)} color={COLORS.text} />
                    </TouchableOpacity>

                    <View style={styles.headerTextWrap}>
                        <Text style={styles.headerEyebrow} numberOfLines={1}>
                            TradeHub Investment
                        </Text>
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            Buy Stock
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.iconButton}
                        activeOpacity={0.7}
                        onPress={() => {
                            fetchUserProfile();
                            fetchStockDetails();
                        }}
                    >
                        <Icon
                            name="refresh"
                            size={scale(18)}
                            color={loadingStock || loadingWallet ? COLORS.primary : COLORS.textSecondary}
                        />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <BuyStockContent
                navigation={navigation}
                stockData={stockData}
                stockError={stockError}
                loadingStock={loadingStock}
                loadingWallet={loadingWallet}
                walletError={walletError}
                loadingPreview={loadingPreview}
                previewError={previewError}
                previewData={previewData}
                marketStatus={marketStatus}
                priceLimit={priceLimit}
                walletBalance={walletBalance}
                minimumTradeAmount={minimumTradeAmount}
                enteredAmount={enteredAmount}
                stockPrice={stockPrice}
                totalPayable={totalPayable}
                isBelowMinimum={isBelowMinimum}
                exceedsBalance={exceedsBalance}
                canTrade={canTrade}
                placingOrder={placingOrder}
                dailyRate={effectiveDailyRate}
                dailyRateLabel={dailyRateLabel}
                perDayReturn={perDayReturn}
                total30DayEstimate={total30DayEstimate}
                lockPeriodDays={lockPeriodDays}
                statusTone={statusTone}
                formatCurrency={formatCurrency}
                formatCompactCurrency={formatCompactCurrency}
                onClear={handleClear}
                onAmountChange={handleAmountChange}
                onConfirmPurchase={openConfirmModal}
            />

            <Modal
                visible={showConfirmModal}
                transparent
                animationType="none"
                onRequestClose={closeConfirmModal}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.modalCard, { transform: [{ scale: scaleAnim }] }]}>
                        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                            <View style={styles.modalIconWrap}>
                                <Icon name="cart-check" size={scale(26)} color={COLORS.primary} />
                            </View>

                            <Text style={styles.modalTitle}>Review Investment</Text>
                            <Text style={styles.modalSubtitle}>
                                Please confirm this investment. Wallet will be deducted instantly and
                                your investment will become active immediately.
                            </Text>

                            <View style={styles.modalSummaryBox}>
                                {[
                                    ['Instrument', stockData?.name],
                                    ['Current Price', `₹${formatCurrency(stockPrice)}`],
                                    ['Minimum Allowed', `₹${formatCurrency(minimumTradeAmount)}`],
                                    ['Investment Amount', `₹${formatCurrency(enteredAmount)}`],
                                    ['Effective Daily Rate', dailyRateLabel],
                                    ['Estimated Daily Earning', `₹${formatCurrency(perDayReturn)}`, COLORS.success],
                                    ['Wallet Balance', `₹${formatCurrency(walletBalance)}`],
                                ].map(([label, value, color]) => (
                                    <React.Fragment key={label}>
                                        <View style={styles.modalSummaryRow}>
                                            <Text style={styles.modalSummaryLabel}>{label}</Text>
                                            <Text style={[styles.modalSummaryValue, color && { color }]}>
                                                {value}
                                            </Text>
                                        </View>
                                        <View style={styles.modalDivider} />
                                    </React.Fragment>
                                ))}

                                <View style={styles.modalSummaryRow}>
                                    <Text style={styles.modalSummaryTotalLabel}>Payable Now</Text>
                                    <Text style={styles.modalSummaryTotalValue}>
                                        ₹{formatCurrency(totalPayable)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.modalSecondaryBtn}
                                    onPress={closeConfirmModal}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.modalSecondaryText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalPrimaryBtn}
                                    onPress={handleFinalConfirm}
                                    activeOpacity={0.85}
                                    disabled={placingOrder}
                                >
                                    <Icon
                                        name={placingOrder ? 'clock-outline' : 'check-circle'}
                                        size={scale(16)}
                                        color={COLORS.white}
                                    />
                                    <Text style={styles.modalPrimaryText}>
                                        {placingOrder ? 'Placing...' : 'Buy Now'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>

            <Modal
                visible={showSuccessModal}
                transparent
                animationType="none"
                onRequestClose={closeSuccessModal}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.successCard, { transform: [{ scale: successScaleAnim }] }]}>
                        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                            <Animated.View
                                style={[styles.successIconWrap, { transform: [{ scale: checkmarkAnim }] }]}
                            >
                                <View style={styles.successGlow}>
                                    <Icon name="check-decagram" size={scale(52)} color={COLORS.success} />
                                </View>
                            </Animated.View>

                            <Text style={styles.successTitle}>Investment Active</Text>
                            <Text style={styles.successSubtitle}>
                                Your investment was created successfully. Wallet has been deducted and
                                the investment is now active.
                            </Text>

                            <View style={styles.orderIdCard}>
                                <Text style={styles.orderIdLabel}>Order ID</Text>
                                <Text style={styles.orderIdValue} numberOfLines={1}>
                                    {orderId}
                                </Text>
                            </View>

                            <View style={styles.successInfoBox}>
                                {[
                                    ['Instrument', stockData?.name],
                                    ['Minimum Allowed', `₹${formatCurrency(minimumTradeAmount)}`],
                                    ['Invested Amount', `₹${formatCurrency(enteredAmount)}`],
                                    ['Effective Daily Rate', dailyRateLabel, COLORS.primary],
                                    ['Estimated Daily Return', `₹${formatCurrency(perDayReturn)}`, COLORS.success],
                                    ['Status', 'Active', COLORS.success],
                                    ['Lock Period', 'Started immediately'],
                                ].map(([label, value, color]) => (
                                    <View style={styles.successInfoRow} key={label}>
                                        <Text style={styles.successInfoLabel}>{label}</Text>
                                        <Text style={[styles.successInfoValue, color && { color }]}>
                                            {value}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.doneButton}
                                onPress={closeSuccessModal}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.doneButtonText}>Done</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

const createStyles = (scale, SCREEN_HEIGHT, isSmallDevice) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: COLORS.background,
        },
        safeAreaHeader: {
            backgroundColor: COLORS.background,
            borderBottomWidth: 1,
            borderBottomColor: '#151515',
        },
        header: {
            paddingHorizontal: scale(14),
            paddingTop: scale(8),
            paddingBottom: scale(12),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        iconButton: {
            width: scale(38),
            height: scale(38),
            borderRadius: scale(12),
            backgroundColor: COLORS.surface2,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: COLORS.border,
        },
        headerTextWrap: {
            flex: 1,
            marginHorizontal: scale(10),
        },
        headerEyebrow: {
            fontSize: scale(isSmallDevice ? 9 : 10),
            color: COLORS.textMuted,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 2,
        },
        headerTitle: {
            fontSize: scale(isSmallDevice ? 17 : 19),
            color: COLORS.text,
            fontWeight: '800',
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: COLORS.overlay,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: scale(14),
            paddingVertical: scale(14),
        },
        modalCard: {
            width: '100%',
            maxWidth: 400,
            maxHeight: SCREEN_HEIGHT * 0.82,
            backgroundColor: COLORS.surface,
            borderRadius: scale(20),
            padding: scale(isSmallDevice ? 16 : 18),
            borderWidth: 1,
            borderColor: COLORS.border,
        },
        modalIconWrap: {
            width: scale(54),
            height: scale(54),
            borderRadius: scale(16),
            backgroundColor: COLORS.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            marginBottom: scale(12),
            borderWidth: 1,
            borderColor: 'rgba(0, 200, 150, 0.22)',
        },
        modalTitle: {
            fontSize: scale(isSmallDevice ? 15 : 16),
            color: COLORS.text,
            fontWeight: '800',
            textAlign: 'center',
            marginBottom: scale(6),
        },
        modalSubtitle: {
            fontSize: scale(isSmallDevice ? 11 : 12),
            color: COLORS.textSecondary,
            textAlign: 'center',
            marginBottom: scale(16),
            lineHeight: scale(isSmallDevice ? 17 : 18),
        },
        modalSummaryBox: {
            backgroundColor: COLORS.background,
            borderRadius: scale(14),
            padding: scale(12),
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: scale(12),
        },
        modalSummaryRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingVertical: scale(7),
        },
        modalDivider: {
            height: 1,
            backgroundColor: COLORS.border,
        },
        modalSummaryLabel: {
            fontSize: scale(isSmallDevice ? 12 : 13),
            color: COLORS.textSecondary,
            fontWeight: '500',
            flex: 1,
            paddingRight: scale(10),
        },
        modalSummaryValue: {
            fontSize: scale(isSmallDevice ? 12 : 14),
            color: COLORS.text,
            fontWeight: '700',
            marginLeft: scale(10),
            textAlign: 'right',
            flexShrink: 1,
            maxWidth: '55%',
        },
        modalSummaryTotalLabel: {
            fontSize: scale(isSmallDevice ? 13 : 14),
            color: COLORS.text,
            fontWeight: '800',
            flex: 1,
            paddingRight: scale(10),
        },
        modalSummaryTotalValue: {
            fontSize: scale(isSmallDevice ? 16 : 18),
            color: COLORS.primary,
            fontWeight: '900',
            marginLeft: scale(10),
            textAlign: 'right',
        },
        modalActions: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: scale(10),
        },
        modalSecondaryBtn: {
            flex: 1,
            minWidth: '40%',
            minHeight: scale(48),
            borderRadius: scale(12),
            backgroundColor: COLORS.background,
            borderWidth: 1,
            borderColor: COLORS.border,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: scale(12),
        },
        modalSecondaryText: {
            color: COLORS.text,
            fontSize: scale(14),
            fontWeight: '700',
        },
        modalPrimaryBtn: {
            flex: 1,
            minWidth: '40%',
            minHeight: scale(48),
            borderRadius: scale(12),
            backgroundColor: COLORS.primary,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: scale(7),
            paddingHorizontal: scale(12),
        },
        modalPrimaryText: {
            color: COLORS.white,
            fontSize: scale(14),
            fontWeight: '800',
        },
        successCard: {
            width: '100%',
            maxWidth: 400,
            maxHeight: SCREEN_HEIGHT * 0.82,
            backgroundColor: COLORS.surface,
            borderRadius: scale(20),
            padding: scale(isSmallDevice ? 16 : 18),
            borderWidth: 1,
            borderColor: COLORS.border,
        },
        successIconWrap: {
            alignItems: 'center',
            marginBottom: scale(16),
        },
        successGlow: {
            width: scale(78),
            height: scale(78),
            borderRadius: scale(24),
            backgroundColor: COLORS.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(0, 200, 150, 0.22)',
        },
        successTitle: {
            fontSize: scale(isSmallDevice ? 20 : 23),
            color: COLORS.success,
            fontWeight: '900',
            textAlign: 'center',
            marginBottom: scale(6),
        },
        successSubtitle: {
            fontSize: scale(isSmallDevice ? 12 : 13),
            color: COLORS.textSecondary,
            textAlign: 'center',
            marginBottom: scale(16),
            lineHeight: scale(18),
        },
        orderIdCard: {
            backgroundColor: COLORS.primaryLight,
            borderRadius: scale(14),
            paddingVertical: scale(10),
            paddingHorizontal: scale(12),
            alignItems: 'center',
            marginBottom: scale(16),
            borderWidth: 1,
            borderColor: 'rgba(0, 200, 150, 0.18)',
        },
        orderIdLabel: {
            fontSize: scale(10),
            color: COLORS.textSecondary,
            fontWeight: '600',
            marginBottom: scale(3),
            textTransform: 'uppercase',
            letterSpacing: 0.8,
        },
        orderIdValue: {
            fontSize: scale(isSmallDevice ? 13 : 15),
            color: COLORS.primary,
            fontWeight: '900',
            letterSpacing: 1,
        },
        successInfoBox: {
            backgroundColor: COLORS.background,
            borderRadius: scale(14),
            padding: scale(12),
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: scale(16),
            gap: scale(10),
        },
        successInfoRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
        },
        successInfoLabel: {
            fontSize: scale(isSmallDevice ? 12 : 13),
            color: COLORS.textSecondary,
            fontWeight: '500',
            flex: 1,
            paddingRight: scale(10),
        },
        successInfoValue: {
            fontSize: scale(isSmallDevice ? 12 : 14),
            color: COLORS.text,
            fontWeight: '800',
            marginLeft: scale(10),
            textAlign: 'right',
            flexShrink: 1,
            maxWidth: '55%',
        },
        doneButton: {
            minHeight: scale(48),
            borderRadius: scale(12),
            backgroundColor: COLORS.primary,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: scale(12),
        },
        doneButtonText: {
            color: COLORS.white,
            fontSize: scale(14),
            fontWeight: '800',
        },
    });

export default BuyStockScreen;