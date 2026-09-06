import React, { useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SERVER_URL } from '../../../../config/api.config';


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
    blue: '#3B82F6',
    white: '#FFFFFF',
};


const resolveLogoUrl = (logoUrl) => {
    if (!logoUrl || typeof logoUrl !== 'string' || !logoUrl.trim()) return null;
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) return logoUrl;
    return `${SERVER_URL}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
};


const StockLogo = ({ logoUrl, size = 44, borderRadius = 14, fallbackSize = 18 }) => {
    const [imgError, setImgError] = React.useState(false);


    React.useEffect(() => {
        setImgError(false);
    }, [logoUrl]);


    const finalLogoUrl = resolveLogoUrl(logoUrl);


    return (
        <View style={[styles.stockLogoWrap, { width: size, height: size, borderRadius }]}>
            {finalLogoUrl && !imgError ? (
                <Image
                    source={{ uri: finalLogoUrl }}
                    style={{ width: size - 10, height: size - 10, borderRadius: 8 }}
                    resizeMode="contain"
                    onError={() => setImgError(true)}
                />
            ) : (
                <Icon name="chart-line" size={fallbackSize} color={COLORS.primary} />
            )}
        </View>
    );
};


const InfoPill = ({ icon, text, color = COLORS.textSecondary, bg = COLORS.surface2 }) => (
    <View style={[styles.infoPill, { backgroundColor: bg }]}>
        <Icon name={icon} size={12} color={color} />
        <Text style={[styles.infoPillText, { color }]} numberOfLines={1}>
            {text}
        </Text>
    </View>
);


const MetricCard = ({ label, value, valueColor = COLORS.text }) => (
    <View style={styles.metricCard}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={[styles.metricValue, { color: valueColor }]} numberOfLines={1}>
            {value}
        </Text>
    </View>
);


const BuyStockContent = ({
    navigation,
    stockData,
    stockError,
    loadingStock,
    loadingWallet,
    walletError,
    loadingPreview,
    previewError,
    previewData,
    marketStatus,
    priceLimit,
    walletBalance,
    minimumTradeAmount,
    enteredAmount,
    stockPrice,
    totalPayable,
    isBelowMinimum,
    exceedsBalance,
    canTrade,
    placingOrder,
    dailyRate,
    dailyRateLabel,
    perDayReturn,
    total30DayEstimate,
    lockPeriodDays,
    formatCurrency,
    formatCompactCurrency,
    onClear,
    onAmountChange,
    onConfirmPurchase,
}) => {
    const amountInputRef = useRef(null);
    const { width } = useWindowDimensions();
    const isCompactWidth = width < 360;
    const isTablet = width >= 700;


    const hasMinimum = Number(minimumTradeAmount || 0) > 0;


    const previewMinimumInvestment = useMemo(() => {
        const candidates = [
            previewData?.minimumInvestment,
            previewData?.minInvestment,
            previewData?.minimumTradeAmount,
            previewData?.indexSnapshot?.minimumInvestment,
            stockData?.minimumInvestment,
            stockData?.minimumTradeAmount,
            minimumTradeAmount,
        ];


        const resolved = candidates.find(
            (value) =>
                value !== null &&
                value !== undefined &&
                !Number.isNaN(Number(value)) &&
                Number(value) > 0
        );


        return Number(resolved || 0);
    }, [
        previewData?.minimumInvestment,
        previewData?.minInvestment,
        previewData?.minimumTradeAmount,
        previewData?.indexSnapshot?.minimumInvestment,
        stockData?.minimumInvestment,
        stockData?.minimumTradeAmount,
        minimumTradeAmount,
    ]);




    const effectiveMinimumTradeAmount = previewMinimumInvestment || Number(minimumTradeAmount || 0);




    const hasLockPeriod = Number(lockPeriodDays || 0) > 0;


    // FIXED: no more forced "0 days" or "30 days" text — shows real backend value,
    // or an honest "Not available" state if backend hasn't sent it yet.
    const lockPeriodText = hasLockPeriod ? `${lockPeriodDays} days` : 'Not available';


    const changeTone = useMemo(() => {
        if (stockData?.isPositive) {
            return { bg: COLORS.successLight, color: COLORS.success, icon: 'trending-up' };
        }
        return { bg: COLORS.errorLight, color: COLORS.error, icon: 'trending-down' };
    }, [stockData?.isPositive]);


    const hasDailyRate = Number(dailyRate || 0) > 0;
    const hasPerDayReturn = Number(perDayReturn || 0) > 0;
    const hasTotal30DayEstimate = Number(total30DayEstimate || 0) > 0;


    const dailyReturnText = hasPerDayReturn ? `₹${formatCompactCurrency(perDayReturn)}` : '₹0';
    const dailyRateText = hasDailyRate ? dailyRateLabel : 'Not available';
    const total30DayText = hasTotal30DayEstimate ? `₹${formatCompactCurrency(total30DayEstimate)}` : '₹0';


    // FIXED: label no longer shows "Not available Estimate" when lock period is unresolved
    const estimateRowLabel = hasLockPeriod ? `${lockPeriodDays} Day Estimate` : 'Estimated Return';


    const amountStateStyle = useMemo(() => {
        if (isBelowMinimum || exceedsBalance || previewError) return styles.amountInputWrapError;
        if (canTrade) return styles.amountInputWrapSuccess;
        return null;
    }, [isBelowMinimum, exceedsBalance, previewError, canTrade]);



    const helperTone = useMemo(() => {
        if (loadingPreview) return { bg: COLORS.warningLight, color: COLORS.warning, icon: 'clock-outline' };
        if (previewError || exceedsBalance) return { bg: COLORS.errorLight, color: COLORS.error, icon: 'alert-circle-outline' };
        if (isBelowMinimum) return { bg: COLORS.warningLight, color: COLORS.warning, icon: 'information-outline' };
        if (canTrade) return { bg: COLORS.successLight, color: COLORS.success, icon: 'check-circle-outline' };
        return { bg: COLORS.surface2, color: COLORS.textSecondary, icon: 'pencil-outline' };
    }, [loadingPreview, previewError, exceedsBalance, isBelowMinimum, canTrade]);


    return (
        <>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    isTablet && { paddingHorizontal: 32, maxWidth: 640, alignSelf: 'center', width: '100%' },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.heroCard}>
                    <View style={styles.heroTop}>
                        <View style={styles.heroIdentity}>
                            <StockLogo logoUrl={stockData?.logoUrl} size={44} borderRadius={14} fallbackSize={18} />
                            <View style={styles.heroTextBlock}>
                                <Text style={styles.stockName} numberOfLines={1}>
                                    {stockData?.name}
                                </Text>
                                <Text style={styles.stockSymbol}>{stockData?.symbol || 'Market Index'}</Text>
                            </View>
                        </View>


                        <InfoPill
                            icon="circle"
                            text={loadingStock || loadingWallet ? 'Syncing' : marketStatus}
                            color={loadingStock || loadingWallet ? COLORS.warning : COLORS.primary}
                            bg={loadingStock || loadingWallet ? COLORS.warningLight : COLORS.primaryLight}
                        />
                    </View>


                    <View style={styles.priceRow}>
                        <View>
                            <Text style={styles.priceLabel}>Current Price</Text>
                            <Text style={[styles.currentPrice, isCompactWidth && { fontSize: 24 }]}>
                                ₹{formatCompactCurrency(stockPrice)}
                            </Text>
                        </View>


                        <View style={[styles.changePill, { backgroundColor: changeTone.bg }]}>
                            <Icon name={changeTone.icon} size={13} color={changeTone.color} />
                            <Text style={[styles.changePillText, { color: changeTone.color }]}>
                                {stockData?.change || '0.00%'}
                            </Text>
                        </View>
                    </View>


                    <View style={styles.heroMetrics}>
                        <MetricCard
                            label="Per Day Return"
                            value={dailyReturnText}
                            valueColor={hasDailyRate ? COLORS.success : COLORS.textSecondary}
                        />
                        <MetricCard
                            label="Daily Rate"
                            value={dailyRateText}
                            valueColor={hasDailyRate ? COLORS.primary : COLORS.textSecondary}
                        />
                    </View>
                </View>


                {stockError ? (
                    <View style={styles.errorBanner}>
                        <Icon name="alert-circle-outline" size={16} color={COLORS.error} />
                        <Text style={styles.errorBannerText}>{stockError}</Text>
                    </View>
                ) : null}


                {walletError ? (
                    <View style={styles.errorBanner}>
                        <Icon name="wallet-alert-outline" size={16} color={COLORS.error} />
                        <Text style={styles.errorBannerText}>{walletError}</Text>
                    </View>
                ) : null}


                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionEyebrow}>Investment</Text>
                            <Text style={styles.sectionHeading}>Enter Amount</Text>
                        </View>


                        <TouchableOpacity style={styles.clearChip} onPress={onClear} activeOpacity={0.8}>
                            <Text style={styles.clearChipText}>Clear</Text>
                        </TouchableOpacity>
                    </View>


                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={[styles.amountInputWrap, amountStateStyle]}
                        onPress={() => amountInputRef.current?.focus()}
                    >
                        <Text style={styles.amountInputLabel}>Enter your amount</Text>


                        <View style={styles.amountInputRow}>
                            <Text style={styles.amountCurrency}>₹</Text>
                            <TextInput
                                ref={amountInputRef}
                                style={[styles.amountInput, isCompactWidth && { fontSize: 30 }]}
                                value={priceLimit}
                                onChangeText={onAmountChange}
                                keyboardType="decimal-pad"
                                returnKeyType="done"
                                placeholder="0"
                                placeholderTextColor={COLORS.textMuted}
                                selectionColor={COLORS.primary}
                            />
                        </View>
                    </TouchableOpacity>


                    {/* <View style={[styles.inputHelperBox, { backgroundColor: helperTone.bg }]}>
                        <Icon name={helperTone.icon} size={15} color={helperTone.color} />
                        <Text style={[styles.inputHelperText, { color: helperTone.color }]}>{helperText}</Text>
                    </View> */}


                    {hasMinimum ? (
                        <View style={styles.backendMinBox}>
                            <Icon name="server" size={14} color={COLORS.primary} />
                            <Text style={styles.backendMinText}>
                                Minimum investment : ₹{formatCompactCurrency(effectiveMinimumTradeAmount)}
                            </Text>
                        </View>
                    ) : null}
                </View>


                <View style={styles.walletSummaryRow}>
                    <View style={[styles.miniCard, { marginRight: 8 }]}>
                        <View style={styles.miniCardTop}>
                            <Icon name="wallet-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.miniCardTitle}>Wallet</Text>
                        </View>
                        <Text style={styles.miniCardValue}>₹{formatCompactCurrency(walletBalance)}</Text>
                        <Text style={styles.miniCardSub}>Max investable amount</Text>
                    </View>


                    <View style={styles.miniCard}>
                        <View style={styles.miniCardTop}>
                            <Icon name="cash-plus" size={16} color={COLORS.primary} />
                            <Text style={styles.miniCardTitle}>Daily Return</Text>
                        </View>
                        <Text style={[styles.miniCardValue, { color: hasDailyRate ? COLORS.success : COLORS.textSecondary }]}>
                            {dailyReturnText}
                        </Text>
                        <Text style={styles.miniCardSub}>{dailyRateText}</Text>
                    </View>
                </View>


                {/*order breakdown */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionEyebrow}>Review</Text>
                            <Text style={styles.sectionHeading}>Order Breakdown</Text>
                        </View>
                    </View>


                    <View style={styles.summaryList}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Instrument</Text>
                            <Text style={styles.summaryValue}>{stockData?.name}</Text>
                        </View>
                        <View style={styles.summaryDivider} />


                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Market Price</Text>
                            <Text style={styles.summaryValue}>₹{formatCurrency(stockPrice)}</Text>
                        </View>
                        <View style={styles.summaryDivider} />


                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Investment Amount</Text>
                            <Text style={styles.summaryValue}>₹{formatCurrency(enteredAmount)}</Text>
                        </View>
                        <View style={styles.summaryDivider} />


                        {hasMinimum ? (
                            <>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Min Allowed</Text>
                                    <Text style={styles.summaryValue}>₹{formatCurrency(effectiveMinimumTradeAmount)}</Text>
                                </View>
                                <View style={styles.summaryDivider} />
                            </>
                        ) : null}


                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Daily Rate</Text>
                            <Text style={[styles.summaryValue, { color: hasDailyRate ? COLORS.primary : COLORS.textSecondary }]}>
                                {dailyRateText}
                            </Text>
                        </View>
                        <View style={styles.summaryDivider} />


                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Daily Return</Text>
                            <Text style={[styles.summaryValue, { color: hasDailyRate ? COLORS.success : COLORS.textSecondary }]}>
                                {dailyReturnText}
                            </Text>
                        </View>
                        <View style={styles.summaryDivider} />


                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>{estimateRowLabel}</Text>
                            <Text style={[styles.summaryValue, { color: hasTotal30DayEstimate ? COLORS.success : COLORS.textSecondary }]}>
                                {total30DayText}
                            </Text>
                        </View>
                        <View style={styles.summaryDivider} />


                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Lock Period</Text>
                            <Text style={styles.summaryValue}>{lockPeriodText}</Text>
                        </View>
                        <View style={styles.summaryDivider} />


                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryTotalLabel}>Payable Now</Text>
                            <Text style={styles.summaryTotalValue}>₹{formatCurrency(totalPayable)}</Text>
                        </View>
                    </View>


                    {/* {!!previewData?.rateSource && (
                        <View style={styles.rateSourceBox}>
                            <Icon name="information-outline" size={14} color={COLORS.primary} />
                            <Text style={styles.rateSourceText}>
                                Rate source: {String(previewData.rateSource).replace(/_/g, ' ')}
                            </Text>
                        </View>
                    )} */}
                </View>
            </ScrollView>


            <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
                <View style={styles.bottomBar}>
                    <View style={styles.bottomAmountPreview}>
                        <Text style={styles.bottomAmountLabel}>Payable Now</Text>
                        <Text style={styles.bottomAmountValue}>₹{formatCompactCurrency(totalPayable)}</Text>
                    </View>


                    <View style={styles.bottomActions}>
                        <TouchableOpacity
                            style={styles.secondaryAction}
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate('Recharge')}
                        >
                            <Icon name="plus-circle" size={16} color={COLORS.white} />
                            <Text style={styles.secondaryActionText}>Add</Text>
                        </TouchableOpacity>


                        <TouchableOpacity
                            style={[styles.primaryAction, (!canTrade || placingOrder || loadingWallet || loadingPreview) && styles.disabledButton]}
                            activeOpacity={canTrade ? 0.85 : 1}
                            disabled={!canTrade || placingOrder || loadingWallet || loadingPreview}
                            onPress={onConfirmPurchase}
                        >
                            <Text
                                style={[
                                    styles.primaryActionText,
                                    (!canTrade || placingOrder || loadingWallet || loadingPreview) && styles.disabledButtonText,
                                ]}
                            >
                                {placingOrder
                                    ? 'Placing...'
                                    : loadingWallet
                                        ? 'Fetching'
                                        : loadingPreview
                                            ? 'Previewing'
                                            : isBelowMinimum
                                                ? `Min ₹${formatCompactCurrency(effectiveMinimumTradeAmount)}`
                                                : exceedsBalance
                                                    ? 'Low Balance'
                                                    : canTrade
                                                        ? 'Review Order'
                                                        : 'Enter Amount'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </>
    );
};


const styles = StyleSheet.create({
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 14, paddingBottom: 18 },
    heroCard: {
        backgroundColor: COLORS.card,
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 10,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    heroIdentity: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
    stockLogoWrap: {
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 200, 150, 0.18)',
    },
    heroTextBlock: { flex: 1, marginLeft: 10 },
    stockName: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
    stockSymbol: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
    infoPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 999,
        gap: 5,
    },
    infoPillText: { fontSize: 11, fontWeight: '700' },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
    priceLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4, fontWeight: '600' },
    currentPrice: { fontSize: 26, fontWeight: '900', color: COLORS.text, letterSpacing: -0.6 },
    changePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999 },
    changePillText: { fontSize: 12, fontWeight: '800', marginLeft: 4 },
    heroMetrics: { flexDirection: 'row', gap: 8 },
    metricCard: {
        flex: 1,
        backgroundColor: COLORS.surface2,
        borderRadius: 12,
        paddingVertical: 9,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    metricLabel: { fontSize: 10, color: COLORS.textMuted, marginBottom: 4, fontWeight: '600' },
    metricValue: { fontSize: 13, fontWeight: '800' },
    errorBanner: {
        backgroundColor: COLORS.errorLight,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    errorBannerText: { color: COLORS.error, fontSize: 11, fontWeight: '600', marginLeft: 6, flex: 1 },
    sectionCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 13,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 10,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    sectionEyebrow: { fontSize: 10, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
    sectionHeading: { fontSize: 15, color: COLORS.text, fontWeight: '800' },
    clearChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border },
    clearChipText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
    amountInputWrap: {
        minHeight: 86,
        borderRadius: 16,
        backgroundColor: COLORS.surface,
        borderWidth: 1.2,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
        paddingVertical: 12,
        justifyContent: 'center',
    },
    amountInputWrapError: { borderColor: COLORS.error, backgroundColor: 'rgba(255,82,82,0.06)' },
    amountInputWrapSuccess: { borderColor: COLORS.success, backgroundColor: 'rgba(0,200,150,0.05)' },
    amountInputLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.6 },
    amountInputRow: { flexDirection: 'row', alignItems: 'center' },
    amountCurrency: { fontSize: 24, color: COLORS.textSecondary, fontWeight: '800', marginRight: 6 },
    amountInput: { flex: 1, fontSize: 34, color: COLORS.text, fontWeight: '900', letterSpacing: -0.8, paddingVertical: 0 },
    inputHelperBox: { marginTop: 9, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' },
    inputHelperText: { flex: 1, marginLeft: 7, fontSize: 11, fontWeight: '700', lineHeight: 16 },
    backendMinBox: {
        marginTop: 9,
        borderRadius: 12,
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 9,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backendMinText: { flex: 1, marginLeft: 7, fontSize: 11, fontWeight: '700', color: COLORS.primary, lineHeight: 16 },
    walletSummaryRow: { flexDirection: 'row', marginBottom: 10 },
    miniCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: COLORS.border },
    miniCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
    miniCardTitle: { marginLeft: 6, fontSize: 12, color: COLORS.textSecondary, fontWeight: '700' },
    miniCardValue: { fontSize: 17, color: COLORS.text, fontWeight: '900', marginBottom: 3, letterSpacing: -0.3 },
    miniCardSub: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
    summaryList: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 11, borderWidth: 1, borderColor: COLORS.border },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    summaryDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 1 },
    summaryLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', flex: 1 },
    summaryValue: { fontSize: 13, color: COLORS.text, fontWeight: '700', marginLeft: 10, textAlign: 'right' },
    summaryTotalLabel: { fontSize: 14, color: COLORS.text, fontWeight: '800', flex: 1 },
    summaryTotalValue: { fontSize: 17, color: COLORS.primary, fontWeight: '900', marginLeft: 10, textAlign: 'right' },
    rateSourceBox: {
        marginTop: 9,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    rateSourceText: { marginLeft: 6, fontSize: 11, fontWeight: '700', color: COLORS.primary, textTransform: 'capitalize' },
    bottomSafe: { backgroundColor: COLORS.background },
    bottomBar: {
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.background,
        flexDirection: 'row',
        alignItems: 'center',
    },
    bottomAmountPreview: { flex: 1, marginRight: 10 },
    bottomAmountLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 },
    bottomAmountValue: { fontSize: 19, color: COLORS.text, fontWeight: '900', letterSpacing: -0.4 },
    bottomActions: { flexDirection: 'row', gap: 8 },
    secondaryAction: {
        minWidth: 72,
        height: 46,
        borderRadius: 12,
        backgroundColor: COLORS.blue,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 12,
    },
    secondaryActionText: { color: COLORS.white, fontWeight: '800', fontSize: 13, marginLeft: 5 },
    primaryAction: {
        minWidth: 134,
        height: 46,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    primaryActionText: { color: COLORS.white, fontWeight: '800', fontSize: 13, letterSpacing: 0.2 },
    disabledButton: { backgroundColor: COLORS.border },
    disabledButtonText: { color: COLORS.textSecondary },
});


export default BuyStockContent;