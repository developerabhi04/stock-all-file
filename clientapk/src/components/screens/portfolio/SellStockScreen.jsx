import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Platform,
    Modal,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const COLORS = {
    background: '#000000',
    surface: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#999999',
    border: '#2A2A2A',
    primary: '#FF5252',
    primaryLight: 'rgba(255, 82, 82, 0.15)',
    success: '#00C896',
    successLight: 'rgba(0, 200, 150, 0.15)',
    error: '#FF5252',
    errorLight: 'rgba(255, 82, 82, 0.15)',
    white: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.85)',
};

const SellStockScreen = ({ navigation, route }) => {
    const { stock } = route?.params || {
        stock: {
            name: 'NIFTY 50',
            value: '25597.65',
            change: '-0.64%',
            isPositive: false,
            holdings: 5000, // Available holdings
            avgPrice: 24000.00, // Average purchase price
        },
    };

   
    const [priceLimit, setPriceLimit] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [orderId, setOrderId] = useState('');

    // User holdings data
    const availableHoldings = stock.holdings || 50;
    const avgPurchasePrice = stock.avgPrice || parseFloat(stock.value) * 0.95;
    const minimumSellAmount = 500;

    // Animation refs
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const successScaleAnim = useRef(new Animated.Value(0)).current;
    const checkmarkAnim = useRef(new Animated.Value(0)).current;

    // Helper functions
    const formatCurrency = (value) => {
        const num = typeof value === 'number' ? value : parseFloat(value) || 0;
        return num.toFixed(2);
    };

    const handleNumberPress = (num) => {
        if (priceLimit.length < 10) {
            setPriceLimit(priceLimit + num);
        }
    };

    const handleBackspace = () => {
        setPriceLimit(priceLimit.slice(0, -1));
    };

    const handleDecimal = () => {
        if (!priceLimit.includes('.')) {
            setPriceLimit(priceLimit + '.');
        }
    };

    const handleClear = () => {
        setPriceLimit('');
    };

    const handleMaxAmount = () => {
        const maxSellValue = availableHoldings * parseFloat(stock.value);
        setPriceLimit(maxSellValue.toString());
    };

    // Generate order ID
    const generateOrderId = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `SELL${timestamp}${random}`;
    };

    // Calculations
    const enteredAmount = parseFloat(priceLimit) || 0;
    const stockPrice = parseFloat(stock.value) || 0;
    const quantity = stockPrice > 0 ? Math.floor(enteredAmount / stockPrice) : 0;
    const totalHoldingsValue = availableHoldings * stockPrice;
    const remainingHoldings = availableHoldings - quantity;
    const remainingValue = remainingHoldings * stockPrice;

    // Profit/Loss calculation
    const profitLoss = (stockPrice - avgPurchasePrice) * quantity;
    const profitLossPercent = avgPurchasePrice > 0 ? ((stockPrice - avgPurchasePrice) / avgPurchasePrice) * 100 : 0;

    // Validation
    const isBelowMinimum = enteredAmount > 0 && enteredAmount < minimumSellAmount;
    const exceedsHoldings = enteredAmount > totalHoldingsValue;
    const canSell = enteredAmount >= minimumSellAmount && enteredAmount <= totalHoldingsValue && quantity > 0;

    // Handle Confirm Sale
    const handleConfirmSale = () => {
        if (canSell) {
            setShowConfirmModal(true);
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }).start();
        }
    };

    // Handle Final Confirm
    const handleFinalConfirm = () => {
        const newOrderId = generateOrderId();
        setOrderId(newOrderId);

        // Close confirmation modal
        Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setShowConfirmModal(false);

            // Show success modal with animation
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
    };

    // Close modals
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
            navigation.goBack();
        });
    };

    const NumberButton = ({ value, onPress }) => (
        <TouchableOpacity
            style={styles.numButton}
            onPress={onPress}
            activeOpacity={0.7}>
            {typeof value === 'string' ? (
                <Text style={styles.numButtonText}>{value}</Text>
            ) : (
                value
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.safeAreaHeader}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}>
                        <Icon name="arrow-left" size={24} color={COLORS.text} />
                    </TouchableOpacity>

                    <View style={styles.headerInfo}>
                        <Text style={styles.stockName} numberOfLines={1} ellipsizeMode="tail">
                            {stock.name}
                        </Text>
                        <View style={styles.stockPriceRow}>
                            <Text style={styles.priceText}>₹{stock.value}</Text>
                            <View style={[
                                styles.changeBadge,
                                { backgroundColor: stock.isPositive ? COLORS.successLight : COLORS.errorLight }
                            ]}>
                                <Icon
                                    name={stock.isPositive ? 'arrow-up' : 'arrow-down'}
                                    size={12}
                                    color={stock.isPositive ? COLORS.success : COLORS.error}
                                />
                                <Text style={[
                                    styles.changeText,
                                    { color: stock.isPositive ? COLORS.success : COLORS.error }
                                ]}>
                                    {stock.change}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.infoButton} activeOpacity={0.7}>
                        <Icon name="information-outline" size={22} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Main Content */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>

                {/* Holdings Section */}
                <View style={styles.holdingsSection}>
                    <View style={styles.holdingsCard}>
                        <View style={styles.holdingsHeader}>
                            <View style={styles.holdingsIconContainer}>
                                <Icon name="briefcase-outline" size={22} color={COLORS.primary} />
                            </View>
                            <View style={styles.holdingsInfo}>
                                <Text style={styles.holdingsLabel}>Your Holdings</Text>
                                <Text style={styles.holdingsAmount}>₹{totalHoldingsValue.toLocaleString('en-IN')}</Text>
                                {/* <Text style={styles.holdingsSubtext}>{availableHoldings} units available</Text> */}
                            </View>
                        </View>

                        {/* Holdings Details */}
                        <View style={styles.holdingsDetailsRow}>
                            <View style={styles.holdingsDetail}>
                                <Text style={styles.holdingsDetailLabel}>Avg. Price</Text>
                                <Text style={styles.holdingsDetailValue}>₹{formatCurrency(avgPurchasePrice)}</Text>
                            </View>
                            <View style={styles.holdingsDetailDivider} />
                            <View style={styles.holdingsDetail}>
                                <Text style={styles.holdingsDetailLabel}>Current Price</Text>
                                <Text style={styles.holdingsDetailValue}>₹{stock.value}</Text>
                            </View>
                        </View>

                        {isBelowMinimum && (
                            <View style={styles.errorContainer}>
                                <Icon name="alert-circle-outline" size={16} color={COLORS.error} />
                                <Text style={styles.errorText}>
                                    Minimum sell amount is ₹{minimumSellAmount}
                                </Text>
                            </View>
                        )}

                        {exceedsHoldings && (
                            <View style={styles.errorContainer}>
                                <Icon name="alert-circle-outline" size={16} color={COLORS.error} />
                                <Text style={styles.errorText}>
                                    Maximum available: ₹{formatCurrency(totalHoldingsValue)}
                                </Text>
                            </View>
                        )}

                        {canSell && (
                            <View style={styles.successContainer}>
                                <Icon name="check-circle-outline" size={16} color={COLORS.success} />
                                <Text style={styles.successText}>
                                    Ready to sell -  {quantity} units -  Remaining: {remainingHoldings} units
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Price Input Section */}
                <View style={styles.priceSection}>
                    <View style={styles.priceSectionHeader}>
                        <Text style={styles.priceLabel}>Enter Amount</Text>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.maxButton}
                                onPress={handleMaxAmount}
                                activeOpacity={0.7}>
                                <Text style={styles.maxButtonText}>SELL ALL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={handleClear}
                                activeOpacity={0.7}>
                                <Text style={styles.clearButtonText}>Clear</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[
                        styles.priceInputContainer,
                        isBelowMinimum && styles.priceInputError,
                        exceedsHoldings && styles.priceInputError,
                        canSell && styles.priceInputSuccess
                    ]}>
                        <Text style={styles.currencySymbol}>₹</Text>
                        <Text style={styles.priceInputText}>
                            {priceLimit || '0'}
                        </Text>
                    </View>

                    <View style={styles.priceHints}>
                        <View style={styles.priceHint}>
                            <Icon name="currency-inr" size={14} color={COLORS.textSecondary} />
                            <Text style={styles.priceHintText}>
                                Min: ₹{minimumSellAmount}
                            </Text>
                        </View>
                        <View style={styles.priceHint}>
                            <Icon name="chart-line" size={14} color={COLORS.textSecondary} />
                            <Text style={styles.priceHintText}>
                                Price: ₹{stock.value}
                            </Text>
                        </View>
                    </View>

                  
                </View>

                {/* Transaction Summary */}
                <View style={styles.summarySection}>
                    <Text style={styles.summaryTitle}>Sale Summary</Text>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Stock Price</Text>
                        <Text style={styles.summaryValue}>₹{stock.value}</Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Sale Amount</Text>
                        <Text style={styles.summaryValue}>₹{formatCurrency(enteredAmount)}</Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Avg. Buy Price</Text>
                        <Text style={styles.summaryValue}>₹{formatCurrency(avgPurchasePrice)}</Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Profit/Loss</Text>
                        <View style={styles.profitLossContainer}>
                            <Text style={[
                                styles.summaryValue,
                                styles.summaryHighlight,
                                { color: profitLoss >= 0 ? COLORS.success : COLORS.error }
                            ]}>
                                {profitLoss >= 0 ? '+' : ''}₹{formatCurrency(Math.abs(profitLoss))}
                            </Text>
                            <Text style={[
                                styles.profitLossPercent,
                                { color: profitLoss >= 0 ? COLORS.success : COLORS.error }
                            ]}>
                                ({profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                            </Text>
                        </View>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Remaining Holdings</Text>
                        <Text style={[styles.summaryValue, { color: COLORS.textSecondary }]}>
                            {remainingHoldings} units
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Section */}
            <SafeAreaView edges={['bottom']} style={styles.safeAreaBottom}>
                <View style={styles.bottomSection}>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.viewHoldingsButton}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('Portfolio')}>
                            <Icon name="briefcase-outline" size={18} color={COLORS.white} />
                            <Text style={styles.viewHoldingsButtonText}>Portfolio</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.sellButton,
                                !canSell && styles.disabledButton
                            ]}
                            activeOpacity={canSell ? 0.8 : 1}
                            disabled={!canSell}
                            onPress={handleConfirmSale}>
                            <Text style={[
                                styles.sellButtonText,
                                !canSell && styles.disabledButtonText
                            ]}>
                                {isBelowMinimum
                                    ? `Min ₹${minimumSellAmount}`
                                    : exceedsHoldings
                                        ? 'Exceeds Holdings'
                                        : canSell
                                            ? 'Sell Now'
                                            : 'Enter Amount'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Number Pad */}
                    <View style={styles.numberPad}>
                        <View style={styles.numberRow}>
                            <NumberButton value="1" onPress={() => handleNumberPress('1')} />
                            <NumberButton value="2" onPress={() => handleNumberPress('2')} />
                            <NumberButton value="3" onPress={() => handleNumberPress('3')} />
                        </View>

                        <View style={styles.numberRow}>
                            <NumberButton value="4" onPress={() => handleNumberPress('4')} />
                            <NumberButton value="5" onPress={() => handleNumberPress('5')} />
                            <NumberButton value="6" onPress={() => handleNumberPress('6')} />
                        </View>

                        <View style={styles.numberRow}>
                            <NumberButton value="7" onPress={() => handleNumberPress('7')} />
                            <NumberButton value="8" onPress={() => handleNumberPress('8')} />
                            <NumberButton value="9" onPress={() => handleNumberPress('9')} />
                        </View>

                        <View style={styles.numberRow}>
                            <NumberButton value="." onPress={handleDecimal} />
                            <NumberButton value="0" onPress={() => handleNumberPress('0')} />
                            <NumberButton
                                value={<Icon name="backspace-outline" size={24} color={COLORS.text} />}
                                onPress={handleBackspace}
                            />
                        </View>
                    </View>
                </View>
            </SafeAreaView>

            {/* Confirmation Modal */}
            <Modal
                visible={showConfirmModal}
                transparent={true}
                animationType="none"
                onRequestClose={closeConfirmModal}>
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.confirmModalContent,
                            {
                                transform: [{ scale: scaleAnim }],
                            }
                        ]}>
                        <View style={styles.modalIconContainer}>
                            <Icon name="alert-circle-outline" size={60} color={COLORS.primary} />
                        </View>

                        <Text style={styles.modalTitle}>Confirm Sale</Text>
                        <Text style={styles.modalSubtitle}>
                            Please review your sale details carefully
                        </Text>

                        {/* Order Details */}
                        <View style={styles.modalDetailsCard}>
                            <View style={styles.modalDetailRow}>
                                <Text style={styles.modalDetailLabel}>Stock</Text>
                                <Text style={styles.modalDetailValue}>{stock.name}</Text>
                            </View>

                            <View style={styles.modalDetailDivider} />

                            <View style={styles.modalDetailRow}>
                                <Text style={styles.modalDetailLabel}>Quantity</Text>
                                <Text style={styles.modalDetailValue}>{quantity} units</Text>
                            </View>

                            <View style={styles.modalDetailDivider} />

                            <View style={styles.modalDetailRow}>
                                <Text style={styles.modalDetailLabel}>Sale Price</Text>
                                <Text style={styles.modalDetailValue}>₹{stock.value}</Text>
                            </View>

                            <View style={styles.modalDetailDivider} />

                            <View style={styles.modalDetailRow}>
                                <Text style={styles.modalDetailLabel}>You'll Receive</Text>
                                <Text style={[styles.modalDetailValue, styles.modalDetailHighlight]}>
                                    ₹{formatCurrency(enteredAmount)}
                                </Text>
                            </View>

                            <View style={styles.modalDetailDivider} />

                            <View style={styles.modalDetailRow}>
                                <Text style={styles.modalDetailLabel}>Profit/Loss</Text>
                                <Text style={[
                                    styles.modalDetailValue,
                                    { color: profitLoss >= 0 ? COLORS.success : COLORS.error }
                                ]}>
                                    {profitLoss >= 0 ? '+' : ''}₹{formatCurrency(Math.abs(profitLoss))}
                                </Text>
                            </View>
                        </View>

                        {/* Modal Buttons */}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={closeConfirmModal}
                                activeOpacity={0.8}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalConfirmButton}
                                onPress={handleFinalConfirm}
                                activeOpacity={0.8}>
                                <Icon name="check-circle" size={20} color={COLORS.white} />
                                <Text style={styles.modalConfirmText}>Yes, Sell Now</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="none"
                onRequestClose={closeSuccessModal}>
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.successModalContent,
                            {
                                transform: [{ scale: successScaleAnim }],
                            }
                        ]}>
                        <Animated.View
                            style={[
                                styles.successIconContainer,
                                {
                                    transform: [{ scale: checkmarkAnim }],
                                }
                            ]}>
                            <Icon name="check-circle" size={80} color={COLORS.success} />
                        </Animated.View>

                        <Text style={styles.successTitle}>Sale Successful!</Text>
                        <Text style={styles.successSubtitle}>
                            Your stocks have been sold successfully
                        </Text>

                        {/* Transaction ID */}
                        <View style={styles.orderIdContainer}>
                            <Text style={styles.orderIdLabel}>Transaction ID</Text>
                            <Text style={styles.orderIdValue}>{orderId}</Text>
                        </View>

                        {/* Success Details */}
                        <View style={styles.successDetailsCard}>
                            <View style={styles.successDetailRow}>
                                <Icon name="chart-line" size={20} color={COLORS.textSecondary} />
                                <View style={styles.successDetailInfo}>
                                    <Text style={styles.successDetailLabel}>Stock Sold</Text>
                                    <Text style={styles.successDetailValue}>{stock.name}</Text>
                                </View>
                            </View>

                            <View style={styles.successDetailRow}>
                                <Icon name="cube-outline" size={20} color={COLORS.textSecondary} />
                                <View style={styles.successDetailInfo}>
                                    <Text style={styles.successDetailLabel}>Quantity</Text>
                                    <Text style={styles.successDetailValue}>{quantity} units</Text>
                                </View>
                            </View>

                            <View style={styles.successDetailRow}>
                                <Icon name="cash" size={20} color={COLORS.textSecondary} />
                                <View style={styles.successDetailInfo}>
                                    <Text style={styles.successDetailLabel}>Amount Received</Text>
                                    <Text style={[styles.successDetailValue, { color: COLORS.success }]}>
                                        ₹{formatCurrency(enteredAmount)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.successDetailRow}>
                                <Icon name={profitLoss >= 0 ? "trending-up" : "trending-down"} size={20} color={profitLoss >= 0 ? COLORS.success : COLORS.error} />
                                <View style={styles.successDetailInfo}>
                                    <Text style={styles.successDetailLabel}>Profit/Loss</Text>
                                    <Text style={[
                                        styles.successDetailValue,
                                        { color: profitLoss >= 0 ? COLORS.success : COLORS.error }
                                    ]}>
                                        {profitLoss >= 0 ? '+' : ''}₹{formatCurrency(Math.abs(profitLoss))}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.successDetailRow}>
                                <Icon name="briefcase" size={20} color={COLORS.textSecondary} />
                                <View style={styles.successDetailInfo}>
                                    <Text style={styles.successDetailLabel}>Remaining Holdings</Text>
                                    <Text style={styles.successDetailValue}>
                                        {remainingHoldings} units
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Success Button */}
                        <TouchableOpacity
                            style={styles.successButton}
                            onPress={closeSuccessModal}
                            activeOpacity={0.8}>
                            <Text style={styles.successButtonText}>Done</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.viewOrderButton}
                            onPress={() => {
                                closeSuccessModal();
                                navigation.navigate('TransactionDetails', { orderId });
                            }}
                            activeOpacity={0.8}>
                            <Text style={styles.viewOrderButtonText}>View Transaction Details</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },


    scrollView: {
        flex: 1,
    },

    scrollContent: {
        paddingBottom: 20,
    },

    safeAreaHeader: {
        backgroundColor: COLORS.surface,
    },

    header: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },

    headerInfo: {
        flex: 1,
        marginRight: 8,
    },

    stockName: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 6,
    },

    stockPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },

    priceText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginRight: 8,
    },

    changeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },

    changeText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 4,
    },

    infoButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    holdingsSection: {
        padding: 16,
    },

    holdingsCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    holdingsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },

    holdingsIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    holdingsInfo: {
        flex: 1,
    },

    holdingsLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 4,
        fontWeight: '500',
    },

    holdingsAmount: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -0.5,
        marginBottom: 4,
    },

    holdingsSubtext: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },

    holdingsDetailsRow: {
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },

    holdingsDetail: {
        flex: 1,
        alignItems: 'center',
    },

    holdingsDetailDivider: {
        width: 1,
        backgroundColor: COLORS.border,
        marginHorizontal: 12,
    },

    holdingsDetailLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginBottom: 6,
        fontWeight: '600',
    },

    holdingsDetailValue: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.text,
    },

    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.errorLight,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
    },

    errorText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.error,
        fontWeight: '600',
        marginLeft: 8,
    },

    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.successLight,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
    },

    successText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.success,
        fontWeight: '600',
        marginLeft: 8,
    },

    priceSection: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },

    priceSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },

    priceLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },

    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },

    maxButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
    },

    maxButtonText: {
        fontSize: 11,
        color: COLORS.white,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    clearButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: COLORS.surface,
    },

    clearButtonText: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '600',
    },

    priceInputContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.border,
        paddingHorizontal: 20,
        paddingVertical: 20,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 80,
    },

    priceInputError: {
        borderColor: COLORS.error,
        backgroundColor: COLORS.errorLight,
    },

    priceInputSuccess: {
        borderColor: COLORS.success,
    },

    currencySymbol: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.textSecondary,
        marginRight: 8,
    },

    priceInputText: {
        fontSize: 40,
        fontWeight: '800',
        color: COLORS.text,
        flex: 1,
        letterSpacing: -1,
    },

    priceHints: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },

    priceHint: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    priceHintText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginLeft: 6,
    },

    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 8,
    },

    quantityLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginRight: 8,
    },

    quantityValue: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
    },

    summarySection: {
        marginHorizontal: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
    },

    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },

    summaryDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 8,
    },

    summaryLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },

    summaryValue: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },

    summaryHighlight: {
        fontSize: 18,
    },

    profitLossContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    profitLossPercent: {
        fontSize: 13,
        fontWeight: '700',
    },

    safeAreaBottom: {
        backgroundColor: COLORS.surface,
    },

    bottomSection: {
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 8,
    },

    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },

    sellButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },

    disabledButton: {
        backgroundColor: COLORS.border,
        shadowOpacity: 0,
    },

    sellButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
        letterSpacing: 0.5,
    },

    disabledButtonText: {
        color: COLORS.textSecondary,
    },

    viewHoldingsButton: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    viewHoldingsButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
        letterSpacing: 0.5,
        marginLeft: 8,
    },

    numberPad: {
        gap: 12,
        marginBottom: 8,
    },

    numberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },

    numButton: {
        flex: 1,
        aspectRatio: 1.3,
        maxHeight: 65,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    numButtonText: {
        fontSize: 24,
        color: COLORS.text,
        fontWeight: '700',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },

    // Confirmation Modal
    confirmModalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    modalIconContainer: {
        alignSelf: 'center',
        marginBottom: 20,
    },

    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },

    modalSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },

    modalDetailsCard: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },

    modalDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },

    modalDetailDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 4,
    },

    modalDetailLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },

    modalDetailValue: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },

    modalDetailHighlight: {
        fontSize: 18,
        color: COLORS.primary,
    },

    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },

    modalCancelButton: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    modalCancelText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },

    modalConfirmButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },

    modalConfirmText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
    },

    // Success Modal
    successModalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    successIconContainer: {
        alignSelf: 'center',
        marginBottom: 20,
    },

    successTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.success,
        textAlign: 'center',
        marginBottom: 8,
    },

    successSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },

    orderIdContainer: {
        backgroundColor: COLORS.primaryLight,
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        alignItems: 'center',
    },

    orderIdLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },

    orderIdValue: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.primary,
        letterSpacing: 1,
    },

    successDetailsCard: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        gap: 16,
    },

    successDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    successDetailInfo: {
        marginLeft: 12,
        flex: 1,
    },

    successDetailLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },

    successDetailValue: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },

    successButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
    },

    successButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
    },

    viewOrderButton: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    viewOrderButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
    },
});

export default SellStockScreen;