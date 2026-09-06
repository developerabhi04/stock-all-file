import React, { useMemo, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Modal,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../../../services/ApiService';

const COLORS = {
    background: '#050505',
    card: '#111214',
    surface: '#0E0F11',
    overlay: 'rgba(0,0,0,0.65)',
    text: '#FFFFFF',
    textMuted: '#8C929C',
    border: '#24272D',
    primary: '#10B981',
    primaryLight: 'rgba(16, 185, 129, 0.14)',
    blue: '#3B82F6',
    blueLight: 'rgba(59, 130, 246, 0.14)',
    danger: '#EF4444',
    dangerLight: 'rgba(239, 68, 68, 0.14)',
    white: '#FFFFFF',
};

const UnlockActionScreen = ({ route, navigation }) => {
    const {
        investmentId,
        indexId,
        indexName,
        indexSymbol,
        amount,
        lockPeriodDays,
        totalInterestEarned,
        defaultDailyRate,
        minimumInvestment,
        logoUrl,
    } = route.params || {};

    const [renewLoading, setRenewLoading] = useState(false);
    const [popup, setPopup] = useState({
        visible: false,
        type: '',
        title: '',
        message: '',
        confirmText: '',
    });

    const formatCurrency = useCallback((value) => {
        return Number(value || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }, []);

    const popupIcon = useMemo(() => {
        if (popup.type === 'renew') {
            return { name: 'autorenew', color: COLORS.primary, bg: COLORS.primaryLight };
        }
        if (popup.type === 'success') {
            return { name: 'check-circle-outline', color: COLORS.primary, bg: COLORS.primaryLight };
        }
        if (popup.type === 'error') {
            return { name: 'alert-circle-outline', color: COLORS.danger, bg: COLORS.dangerLight };
        }
        return { name: 'information-outline', color: COLORS.blue, bg: COLORS.blueLight };
    }, [popup.type]);

    const openPopup = ({ type, title, message, confirmText }) => {
        setPopup({
            visible: true,
            type,
            title,
            message,
            confirmText,
        });
    };

    const closePopup = () => {
        if (renewLoading) return;
        setPopup({
            visible: false,
            type: '',
            title: '',
            message: '',
            confirmText: '',
        });
    };

    const goToPortfolioTab = useCallback(() => {
        navigation.dispatch(
            CommonActions.navigate({
                name: 'Home',
                params: {
                    screen: 'Portfolio',
                },
            })
        );
    }, [navigation]);

    const handleRenew = () => {
        if (!investmentId || renewLoading) return;

        openPopup({
            type: 'renew',
            title: 'Renew Investment',
            message: `Re-invest ₹${formatCurrency(amount)} into ${indexName} for another ${lockPeriodDays} days at the current rate?`,
            confirmText: 'Renew Now',
        });
    };

    const performRenew = async () => {
        try {
            if (!investmentId) {
                throw new Error('Investment id is missing');
            }

            setRenewLoading(true);

            const response = await ApiService.renewInvestment(investmentId);

            if (!response?.success) {
                throw new Error(response?.message || 'Failed to renew investment');
            }

            setPopup({
                visible: true,
                type: 'success',
                title: 'Renewal Successful',
                message: 'Your investment has been renewed successfully.',
                confirmText: 'Go to Portfolio',
            });
        } catch (err) {
            setPopup({
                visible: true,
                type: 'error',
                title: 'Renewal Failed',
                message: err?.message || 'Unable to renew investment right now.',
                confirmText: 'Close',
            });
        } finally {
            setRenewLoading(false);
        }
    };

    const handlePopupConfirm = () => {
        if (popup.type === 'renew') {
            performRenew();
            return;
        }

        if (popup.type === 'success') {
            closePopup();
            setTimeout(() => {
                goToPortfolioTab();
            }, 120);
            return;
        }

        closePopup();
    };

    const handleReinvest = () => {
        const numericAmount = Number(amount || 0);

        const reinvestStock = {
            _id: indexId,
            id: indexId,
            name: indexName || 'Investment',
            symbol: indexSymbol || '',
            ticker: indexSymbol || '',
            value: numericAmount || '',
            currentValue: numericAmount || '',
            currentPrice: numericAmount || '',
            price: numericAmount || '',
            change: 0,
            changePercent: 0,
            isPositive: true,
            logoUrl: logoUrl || '',
            defaultDailyRate: defaultDailyRate ?? 0,
            minimumInvestment: minimumInvestment ?? numericAmount ?? 0,
            minInvestment: minimumInvestment ?? numericAmount ?? 0,
            lockPeriodDays: lockPeriodDays ?? 30,
            periodDays: lockPeriodDays ?? 30,
            lockDays: lockPeriodDays ?? 30,
            type: 'Index',
        };

        navigation.navigate('BuyStock', {
            stock: reinvestStock,
            indexId,
            indexName,
            indexSymbol,
            reinvestFromInvestmentId: investmentId,
            suggestedAmount: numericAmount,
            minimumTradeAmount: minimumInvestment ?? numericAmount ?? 0,
            lockDays: lockPeriodDays ?? 30,
            lockPeriodDays: lockPeriodDays ?? 30,
            defaultDailyRate: defaultDailyRate ?? 0,
            fromUnlockAction: true,
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        disabled={renewLoading}
                    >
                        <Icon name="arrow-left" size={20} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>What's Next?</Text>
                </View>
            </SafeAreaView>

            <View style={styles.content}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Principal Unlocked</Text>
                    <Text style={styles.summaryValue}>₹{formatCurrency(amount)}</Text>
                    <Text style={styles.summarySubtext}>
                        {indexName} ({indexSymbol}) • Earned ₹{formatCurrency(totalInterestEarned)}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.optionCard, renewLoading && styles.optionCardDisabled]}
                    activeOpacity={0.88}
                    disabled={renewLoading}
                    onPress={handleRenew}
                >
                    <View style={[styles.optionIcon, { backgroundColor: COLORS.primaryLight }]}>
                        {renewLoading ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <Icon name="autorenew" size={22} color={COLORS.primary} />
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.optionTitle}>Renew Investment</Text>
                        <Text style={styles.optionSubtitle}>
                            Reinvest the same amount into {indexName} for another {lockPeriodDays} days
                        </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.optionCard, renewLoading && styles.optionCardDisabled]}
                    activeOpacity={0.88}
                    onPress={handleReinvest}
                    disabled={renewLoading}
                >
                    <View style={[styles.optionIcon, { backgroundColor: COLORS.blueLight }]}>
                        <Icon name="cash-plus" size={22} color={COLORS.blue} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.optionTitle}>Reinvest</Text>
                        <Text style={styles.optionSubtitle}>
                            Choose a new amount or continue with this index
                        </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
            </View>

            <Modal
                transparent
                visible={popup.visible}
                animationType="fade"
                onRequestClose={closePopup}
            >
                <Pressable style={styles.modalOverlay} onPress={closePopup}>
                    <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                        <View style={[styles.modalIconWrap, { backgroundColor: popupIcon.bg }]}>
                            <Icon name={popupIcon.name} size={24} color={popupIcon.color} />
                        </View>

                        <Text style={styles.modalTitle}>{popup.title}</Text>
                        <Text style={styles.modalMessage}>{popup.message}</Text>

                        <View style={styles.modalButtons}>
                            {popup.type === 'renew' ? (
                                <TouchableOpacity
                                    style={styles.modalSecondaryButton}
                                    activeOpacity={0.88}
                                    disabled={renewLoading}
                                    onPress={closePopup}
                                >
                                    <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            ) : null}

                            <TouchableOpacity
                                style={[
                                    styles.modalPrimaryButton,
                                    popup.type === 'error' && styles.modalPrimaryButtonDanger,
                                ]}
                                activeOpacity={0.88}
                                disabled={renewLoading}
                                onPress={handlePopupConfirm}
                            >
                                {renewLoading && popup.type === 'renew' ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <Text style={styles.modalPrimaryButtonText}>{popup.confirmText}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    safeAreaTop: { backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.text,
    },
    content: {
        padding: 16,
    },
    summaryCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 20,
    },
    summaryLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    summaryValue: {
        fontSize: 26,
        fontWeight: '900',
        color: COLORS.text,
    },
    summarySubtext: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 6,
        fontWeight: '600',
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 12,
        gap: 12,
    },
    optionCardDisabled: {
        opacity: 0.65,
    },
    optionIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 3,
    },
    optionSubtitle: {
        fontSize: 11,
        color: COLORS.textMuted,
        lineHeight: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalCard: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    modalIconWrap: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 14,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 13,
        lineHeight: 20,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 18,
    },
    modalPrimaryButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    modalPrimaryButtonDanger: {
        backgroundColor: COLORS.danger,
    },
    modalPrimaryButtonText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '900',
    },
    modalSecondaryButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: 14,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    modalSecondaryButtonText: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '800',
    },
});

export default UnlockActionScreen;