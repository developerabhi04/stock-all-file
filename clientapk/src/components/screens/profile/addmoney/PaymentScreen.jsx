// src/screens/PaymentScreen.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Animated,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import ApiService from '../../../../services/ApiService';

const COLORS = {
    bg: '#000000',
    card: '#18181B',
    card2: '#101012',
    border: '#2A2A2E',
    borderSoft: '#232327',
    text: '#FFFFFF',
    textMuted: '#A1A1AA',
    textDim: '#6B7280',
    primary: '#00C896',
    primarySoft: 'rgba(0, 200, 150, 0.12)',
    primarySoft2: 'rgba(0, 200, 150, 0.08)',
    success: '#00C896',
    warning: '#F5C46B',
    warningBg: '#1F1708',
    warningBorder: '#46351B',
    danger: '#FF6B6B',
    dangerBg: 'rgba(255, 107, 107, 0.08)',
    blueTint: '#0C1715',
    inputBg: '#0E0E0E',
    overlay: 'rgba(0,0,0,0.72)',
    skeletonBase: '#202024',
    skeletonHighlight: '#2A2A2F',
};

const QUICK_AMOUNTS = [2000, 5000, 10000, 20000, 50000, 100000, 250000];
const BOTTOM_BAR_SPACE = 140;

const formatAmount = (value) => {
    const num = Number(value || 0);
    if (Number.isNaN(num)) return '0';
    return num.toLocaleString('en-IN');
};

const getSafeConfig = (raw) => {
    const data = raw?.data?.data || raw?.data || raw || {};
    const upi = data?.upi || data?.upiConfig || data?.upiDetails || {};
    const bank = data?.bank || data?.bankConfig || data?.bankDetails || {};

    return {
        upi: {
            enabled: upi?.enabled === true || !!upi?.upiId || !!upi?.id || !!upi?.vpa,
            upiId: upi?.upiId || upi?.id || upi?.vpa || '',
            payeeName: upi?.payeeName || upi?.name || upi?.merchantName || '',
        },
        bank: {
            enabled:
                bank?.enabled === true ||
                !!bank?.accountNumber ||
                !!bank?.ifscCode ||
                !!bank?.bankName,
            accountHolderName:
                bank?.accountHolderName || bank?.holderName || bank?.name || '',
            accountNumber: bank?.accountNumber || bank?.accNo || '',
            ifscCode: bank?.ifscCode || bank?.ifsc || '',
            bankName: bank?.bankName || bank?.name || '',
            branchName: bank?.branchName || bank?.branch || '',
            accountType: bank?.accountType || bank?.type || 'Savings',
        },
    };
};

const CopyChip = ({ label, value }) => {
    const [copied, setCopied] = useState(false);
    const scale = useRef(new Animated.Value(1)).current;

    const onCopy = () => {
        if (!value) return;

        Clipboard.setString(String(value));
        setCopied(true);

        Animated.sequence([
            Animated.timing(scale, {
                toValue: 0.95,
                duration: 80,
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: 1,
                duration: 120,
                useNativeDriver: true,
            }),
        ]).start();

        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={onCopy}
                style={[styles.copyChip, copied && styles.copyChipActive]}>
                <Icon
                    name={copied ? 'check-circle' : 'content-copy'}
                    size={15}
                    color={copied ? COLORS.primary : COLORS.textMuted}
                />
                <Text
                    numberOfLines={1}
                    style={[styles.copyChipText, copied && styles.copyChipTextActive]}>
                    {copied ? 'Copied' : `Copy ${label}`}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const MethodCard = ({ active, onPress, icon, title, subtitle }) => (
    <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.methodCard, active && styles.methodCardActive]}>
        <View style={[styles.methodIconWrap, active && styles.methodIconWrapActive]}>
            <Icon name={icon} size={22} color={active ? '#FFFFFF' : COLORS.primary} />
        </View>

        <View style={styles.methodTextWrap}>
            <Text style={styles.methodTitle}>{title}</Text>
            <Text style={[styles.methodSubtitle, active && styles.methodSubtitleActive]}>
                {subtitle}
            </Text>
        </View>

        <Icon
            name={active ? 'check-circle' : 'chevron-right'}
            size={22}
            color={active ? COLORS.primary : COLORS.textDim}
        />
    </TouchableOpacity>
);

const DetailRow = ({ label, value, copyable = false, mono = false, last = false }) => {
    if (!value) return null;

    return (
        <View style={[styles.detailRow, last && styles.detailRowLast]}>
            <Text style={styles.detailLabel}>{label}</Text>

            <View style={styles.detailRight}>
                <Text
                    selectable
                    style={[styles.detailValue, mono && styles.monoText]}
                    numberOfLines={2}>
                    {value}
                </Text>
                {copyable ? (
                    <View style={styles.detailActionWrap}>
                        <CopyChip label={label} value={value} />
                    </View>
                ) : null}
            </View>
        </View>
    );
};

const StepRow = ({ index, text }) => (
    <View style={styles.stepRow}>
        <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{index}</Text>
        </View>
        <Text style={styles.stepText}>{text}</Text>
    </View>
);

const SkeletonBlock = ({ width, height, borderRadius = 12, style, animatedStyle }) => (
    <Animated.View
        style={[
            {
                width,
                height,
                borderRadius,
                backgroundColor: COLORS.skeletonBase,
            },
            animatedStyle,
            style,
        ]}
    />
);

const PaymentScreenSkeleton = ({ shimmerAnim, navigation }) => {
    const skeletonOpacity = shimmerAnim.interpolate({
        inputRange: [0.45, 1],
        outputRange: [0.45, 1],
    });

    const animatedStyle = { opacity: skeletonOpacity };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Money</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                <View style={styles.heroCard}>
                    <View style={styles.heroGlow} />

                    <View style={styles.heroTopRow}>
                        <View style={styles.heroTopContent}>
                            <SkeletonBlock
                                width={110}
                                height={12}
                                borderRadius={6}
                                animatedStyle={animatedStyle}
                                style={{ marginBottom: 10 }}
                            />
                            <SkeletonBlock
                                width={190}
                                height={24}
                                borderRadius={8}
                                animatedStyle={animatedStyle}
                            />
                        </View>

                        <SkeletonBlock
                            width={82}
                            height={34}
                            borderRadius={999}
                            animatedStyle={animatedStyle}
                        />
                    </View>

                    <View style={styles.amountInputWrap}>
                        <SkeletonBlock
                            width={22}
                            height={30}
                            borderRadius={8}
                            animatedStyle={animatedStyle}
                            style={{ marginRight: 8 }}
                        />
                        <SkeletonBlock
                            width="55%"
                            height={42}
                            borderRadius={10}
                            animatedStyle={animatedStyle}
                        />
                    </View>

                    <View style={styles.amountMetaRow}>
                        <SkeletonBlock
                            width={60}
                            height={11}
                            borderRadius={6}
                            animatedStyle={animatedStyle}
                        />
                        <SkeletonBlock
                            width={88}
                            height={11}
                            borderRadius={6}
                            animatedStyle={animatedStyle}
                        />
                    </View>

                    <SkeletonBlock
                        width="72%"
                        height={12}
                        borderRadius={6}
                        animatedStyle={animatedStyle}
                        style={{ marginTop: 12 }}
                    />
                </View>

                <View style={styles.section}>
                    <SkeletonBlock
                        width={110}
                        height={18}
                        borderRadius={8}
                        animatedStyle={animatedStyle}
                        style={{ marginBottom: 14 }}
                    />

                    <View style={styles.quickGrid}>
                        {[1, 2, 3, 4, 5, 6].map((item) => (
                            <View key={item} style={styles.quickChip}>
                                <SkeletonBlock
                                    width="60%"
                                    height={14}
                                    borderRadius={7}
                                    animatedStyle={animatedStyle}
                                />
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <SkeletonBlock
                        width={170}
                        height={18}
                        borderRadius={8}
                        animatedStyle={animatedStyle}
                        style={{ marginBottom: 14 }}
                    />

                    {[1, 2].map((item) => (
                        <View key={item} style={styles.methodCard}>
                            <SkeletonBlock
                                width={46}
                                height={46}
                                borderRadius={14}
                                animatedStyle={animatedStyle}
                            />

                            <View style={styles.methodTextWrap}>
                                <SkeletonBlock
                                    width="52%"
                                    height={14}
                                    borderRadius={6}
                                    animatedStyle={animatedStyle}
                                    style={{ marginBottom: 8 }}
                                />
                                <SkeletonBlock
                                    width="84%"
                                    height={12}
                                    borderRadius={6}
                                    animatedStyle={animatedStyle}
                                />
                            </View>

                            <SkeletonBlock
                                width={22}
                                height={22}
                                borderRadius={11}
                                animatedStyle={animatedStyle}
                            />
                        </View>
                    ))}
                </View>

                <View style={styles.previewPanel}>
                    <View style={styles.previewHeaderRow}>
                        <SkeletonBlock
                            width={18}
                            height={18}
                            borderRadius={9}
                            animatedStyle={animatedStyle}
                        />
                        <SkeletonBlock
                            width={140}
                            height={14}
                            borderRadius={7}
                            animatedStyle={animatedStyle}
                            style={{ marginLeft: 8 }}
                        />
                    </View>

                    <SkeletonBlock
                        width="46%"
                        height={15}
                        borderRadius={7}
                        animatedStyle={animatedStyle}
                        style={{ marginBottom: 8 }}
                    />
                    <SkeletonBlock
                        width="58%"
                        height={13}
                        borderRadius={7}
                        animatedStyle={animatedStyle}
                    />
                </View>

                <View style={styles.infoCard}>
                    <SkeletonBlock
                        width={18}
                        height={18}
                        borderRadius={9}
                        animatedStyle={animatedStyle}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <SkeletonBlock
                            width="96%"
                            height={12}
                            borderRadius={6}
                            animatedStyle={animatedStyle}
                            style={{ marginBottom: 8 }}
                        />
                        <SkeletonBlock
                            width="88%"
                            height={12}
                            borderRadius={6}
                            animatedStyle={animatedStyle}
                        />
                    </View>
                </View>
            </ScrollView>

            <SafeAreaView edges={['bottom']} style={styles.safeAreaBottom}>
                <View style={styles.bottomBar}>
                    <View style={[styles.primaryButton, styles.primaryButtonDisabled]}>
                        <SkeletonBlock
                            width="72%"
                            height={16}
                            borderRadius={8}
                            animatedStyle={animatedStyle}
                            style={{ backgroundColor: COLORS.skeletonHighlight }}
                        />
                    </View>
                </View>
            </SafeAreaView>
        </SafeAreaView>
    );
};

const AppPopup = ({
    visible,
    type = 'info',
    title,
    message,
    amount,
    utrValue,
    method,
    confirmText = 'Okay',
    cancelText = '',
    loading = false,
    onConfirm,
    onCancel,
    onClose,
}) => {
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 70,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0.9);
            opacityAnim.setValue(0);
        }
    }, [visible, opacityAnim, scaleAnim]);

    const iconName =
        type === 'success'
            ? 'check-decagram'
            : type === 'error'
                ? 'alert-circle'
                : type === 'confirm'
                    ? 'shield-check'
                    : 'information';

    const iconColor =
        type === 'error'
            ? COLORS.danger
            : type === 'success'
                ? COLORS.success
                : COLORS.primary;

    const infoRows = [
        amount ? { label: 'Amount', value: `₹${formatAmount(amount)}` } : null,
        utrValue ? { label: 'UTR Number', value: utrValue, mono: true } : null,
        method
            ? {
                label: 'Method',
                value: method === 'upi' ? 'UPI Payment' : 'Bank Transfer',
            }
            : null,
    ].filter(Boolean);

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <Animated.View
                    style={[
                        styles.modalCard,
                        {
                            opacity: opacityAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={onClose}
                        style={styles.modalCloseBtn}>
                        <Icon name="close" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>

                    <View style={[styles.modalIconWrap, { borderColor: `${iconColor}40` }]}>
                        <View style={[styles.modalIconInner, { backgroundColor: `${iconColor}18` }]}>
                            <Icon name={iconName} size={28} color={iconColor} />
                        </View>
                    </View>

                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.modalMessage}>{message}</Text>

                    {infoRows.length > 0 && (
                        <View style={styles.modalInfoCard}>
                            {infoRows.map((row, index) => (
                                <View
                                    key={row.label}
                                    style={[
                                        styles.modalInfoRow,
                                        index === infoRows.length - 1 && styles.modalInfoRowLast,
                                    ]}>
                                    <Text style={styles.modalInfoLabel}>{row.label}</Text>
                                    <Text
                                        style={[
                                            styles.modalInfoValue,
                                            row.mono && styles.modalMono,
                                        ]}>
                                        {row.value}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={styles.modalBottomNote}>
                        <Icon name="wallet-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.modalBottomNoteText}>
                            Your amount will deposit in wallet shortly after verification.
                        </Text>
                    </View>

                    <View style={styles.modalButtonRow}>
                        {!!cancelText && (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={onCancel}
                                style={styles.modalSecondaryBtn}
                                disabled={loading}>
                                <Text style={styles.modalSecondaryBtnText}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={onConfirm}
                            style={[
                                styles.modalPrimaryBtn,
                                !cancelText && styles.modalPrimaryBtnFull,
                                loading && styles.modalPrimaryBtnDisabled,
                            ]}
                            disabled={loading}>
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Icon name="check-circle" size={18} color="#FFFFFF" />
                                    <Text style={styles.modalPrimaryBtnText}>{confirmText}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const PaymentScreen = ({ route }) => {
    const navigation = useNavigation();
    const { amount: initialAmount = '' } = route?.params || {};

    const [amount, setAmount] = useState(String(initialAmount || ''));
    const [utr, setUtr] = useState('');
    const [activeMethod, setActiveMethod] = useState(null);
    const [config, setConfig] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [step, setStep] = useState(1);

    const shimmerAnim = useRef(new Animated.Value(0.45)).current;

    const [popup, setPopup] = useState({
        visible: false,
        type: 'info',
        title: '',
        message: '',
        amount: '',
        utrValue: '',
        method: '',
        confirmText: 'Okay',
        cancelText: '',
        loading: false,
        onConfirm: () => { },
        onCancel: () => { },
        onClose: () => { },
    });

    useEffect(() => {
        const shimmerLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0.45,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );

        shimmerLoop.start();

        return () => {
            shimmerLoop.stop();
        };
    }, [shimmerAnim]);

    const closePopup = useCallback(() => {
        setPopup((prev) => ({
            ...prev,
            visible: false,
            loading: false,
        }));
    }, []);

    const openPopup = useCallback(({
        type = 'info',
        title = '',
        message = '',
        amount: popupAmount = '',
        utrValue = '',
        method = '',
        confirmText = 'Okay',
        cancelText = '',
        loading = false,
        onConfirm,
        onCancel,
        onClose,
    }) => {
        setPopup({
            visible: true,
            type,
            title,
            message,
            amount: popupAmount,
            utrValue,
            method,
            confirmText,
            cancelText,
            loading,
            onConfirm: onConfirm || closePopup,
            onCancel: onCancel || closePopup,
            onClose: onClose || closePopup,
        });
    }, [closePopup]);

    const fetchPaymentConfig = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await ApiService.getPaymentConfig();
            const parsed = getSafeConfig(res);
            setConfig(parsed);

            const hasUpiNow = parsed?.upi?.enabled && !!parsed?.upi?.upiId;
            const hasBankNow =
                parsed?.bank?.enabled &&
                (!!parsed?.bank?.accountNumber ||
                    !!parsed?.bank?.ifscCode ||
                    !!parsed?.bank?.bankName ||
                    !!parsed?.bank?.accountHolderName);

            if (hasUpiNow) {
                setActiveMethod('upi');
            } else if (hasBankNow) {
                setActiveMethod('bank');
            } else {
                setActiveMethod(null);
                setError('No payment methods are currently available. Please try again later.');
            }
        } catch (err) {
            console.error('fetchPaymentConfig error:', err);
            setError('Failed to load payment details. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPaymentConfig();
    }, [fetchPaymentConfig]);

    const hasUpi = !!(config?.upi?.enabled && config?.upi?.upiId);
    const hasBank = !!(
        config?.bank?.enabled &&
        (config?.bank?.accountNumber ||
            config?.bank?.ifscCode ||
            config?.bank?.bankName ||
            config?.bank?.accountHolderName)
    );

    const amountNumber = Number(amount || 0);

    const validateAmount = () => {
        if (!amount || Number.isNaN(amountNumber)) {
            openPopup({
                type: 'error',
                title: 'Invalid amount',
                message: 'Please enter a valid recharge amount to continue.',
            });
            return false;
        }

        if (amountNumber < 2000) {
            openPopup({
                type: 'error',
                title: 'Minimum amount required',
                message: 'Minimum deposit amount is ₹2,000.',
                amount,
            });
            return false;
        }

        if (amountNumber > 500000) {
            openPopup({
                type: 'error',
                title: 'Maximum amount exceeded',
                message: 'Maximum deposit amount is ₹5,00,000 per transaction.',
                amount,
            });
            return false;
        }

        return true;
    };

    const validateUtr = () => {
        if (!utr.trim()) {
            openPopup({
                type: 'error',
                title: 'UTR number required',
                message: 'Please enter the UTR / transaction reference number.',
                amount,
                method: activeMethod,
            });
            return false;
        }

        if (utr.trim().length < 6) {
            openPopup({
                type: 'error',
                title: 'Invalid UTR number',
                message: 'UTR number must be at least 6 characters long.',
                amount,
                utrValue: utr.trim(),
                method: activeMethod,
            });
            return false;
        }

        return true;
    };

    const handleProceed = () => {
        if (!validateAmount()) return;

        if (!activeMethod) {
            openPopup({
                type: 'error',
                title: 'Select payment method',
                message: 'Please choose one payment method to continue.',
                amount,
            });
            return;
        }

        setStep(2);
    };

    const navigateAfterSuccess = useCallback(() => {
        closePopup();
        setAmount('');
        setUtr('');
        setStep(1);

        try {
            navigation.navigate('ProfileWallet');
        } catch (error) {
            try {
                navigation.navigate('Profile');
            } catch (innerError) {
                navigation.goBack();
            }
        }
    }, [closePopup, navigation]);

    const doSubmitPayment = async () => {
        setIsSubmitting(true);
        setPopup((prev) => ({ ...prev, loading: true }));

        try {
            const response = await ApiService.submitPayment({
                amount: Number(amount),
                utrNumber: utr.trim(),
                paymentMethod: activeMethod,
                gateway: activeMethod === 'upi' ? 'UPI' : 'Bank Transfer',
            });

            if (!response?.success) {
                throw new Error(response?.message || 'Failed to submit payment. Please try again.');
            }

            setIsSubmitting(false);

            openPopup({
                type: 'success',
                title: 'Request submitted successfully',
                message: response?.message || 'Your deposit request has been created successfully.',
                amount,
                utrValue: utr.trim(),
                method: activeMethod,
                confirmText: 'Go to Wallet',
                cancelText: 'Done',
                onConfirm: navigateAfterSuccess,
                onCancel: () => {
                    closePopup();
                    navigation.goBack();
                },
                onClose: closePopup,
            });
        } catch (err) {
            console.error('submitPayment error:', err);
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to submit payment. Please try again.';

            setIsSubmitting(false);

            openPopup({
                type: 'error',
                title: 'Submission failed',
                message: msg,
                amount,
                utrValue: utr.trim(),
                method: activeMethod,
            });
        }
    };

    const handleSubmit = () => {
        if (!validateUtr()) return;

        openPopup({
            type: 'confirm',
            title: 'Confirm payment request',
            message: 'Please review your payment details before submitting the request.',
            amount,
            utrValue: utr.trim(),
            method: activeMethod,
            confirmText: 'Submit Request',
            cancelText: 'Cancel',
            onConfirm: doSubmitPayment,
            onCancel: closePopup,
            onClose: closePopup,
        });
    };

    if (isLoading) {
        return <PaymentScreenSkeleton shimmerAnim={shimmerAnim} navigation={navigation} />;
    }

    if (error) {
        return (
            <SafeAreaView style={styles.safe}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-left" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Money</Text>
                    <View style={styles.backButton} />
                </View>

                <View style={styles.centerState}>
                    <View style={styles.centerIconBox}>
                        <Icon name="alert-circle-outline" size={36} color={COLORS.danger} />
                    </View>
                    <Text style={styles.centerTitle}>Payment unavailable</Text>
                    <Text style={styles.centerSubtext}>{error}</Text>

                    <TouchableOpacity style={styles.retryBtn} onPress={fetchPaymentConfig}>
                        <Text style={styles.retryBtnText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

                <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => (step === 1 ? navigation.goBack() : setStep(1))}>
                            <Icon name="arrow-left" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>
                            {step === 1
                                ? 'Add Money'
                                : activeMethod === 'upi'
                                    ? 'Payment Details'
                                    : 'Bank Transfer'}
                        </Text>
                        <View style={styles.backButton} />
                    </View>
                </SafeAreaView>

                {step === 1 ? (
                    <KeyboardAvoidingView
                        style={styles.flex}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled">

                            <View style={styles.heroCard}>
                                <View style={styles.heroGlow} />

                                <View style={styles.heroTopRow}>
                                    <View style={styles.heroTopContent}>
                                        <Text style={styles.heroLabel}>Wallet Recharge</Text>
                                        <Text style={styles.heroTitle}>Add funds securely</Text>
                                    </View>

                                    <View style={styles.heroBadge}>
                                        <Icon name="shield-check" size={18} color={COLORS.primary} />
                                        <Text style={styles.heroBadgeText}>Secure</Text>
                                    </View>
                                </View>

                                <View style={styles.amountInputWrap}>
                                    <Text style={styles.currencySymbol}>₹</Text>
                                    <TextInput
                                        style={styles.amountInput}
                                        placeholder="0"
                                        placeholderTextColor={COLORS.textDim}
                                        keyboardType="numeric"
                                        value={amount}
                                        onChangeText={(text) =>
                                            setAmount(text.replace(/[^0-9]/g, ''))
                                        }
                                        maxLength={7}
                                    />
                                </View>

                                <View style={styles.amountMetaRow}>
                                    <Text style={styles.amountMetaText}>Min ₹2,000</Text>
                                    <Text style={styles.amountMetaText}>Max ₹5,00,000</Text>
                                </View>

                                {amountNumber > 0 ? (
                                    <Text style={styles.amountHint}>
                                        You are adding ₹{formatAmount(amount)} to your wallet
                                    </Text>
                                ) : null}
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Quick Amount</Text>

                                <View style={styles.quickGrid}>
                                    {QUICK_AMOUNTS.map((item) => {
                                        const selected = String(item) === amount;

                                        return (
                                            <TouchableOpacity
                                                key={item}
                                                activeOpacity={0.8}
                                                onPress={() => setAmount(String(item))}
                                                style={[
                                                    styles.quickChip,
                                                    selected && styles.quickChipSelected,
                                                ]}>
                                                <Text
                                                    style={[
                                                        styles.quickChipText,
                                                        selected && styles.quickChipTextSelected,
                                                    ]}>
                                                    ₹{item.toLocaleString('en-IN')}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Choose Payment Method</Text>

                                {hasUpi ? (
                                    <MethodCard
                                        active={activeMethod === 'upi'}
                                        onPress={() => setActiveMethod('upi')}
                                        icon="qrcode-scan"
                                        title="UPI Payment"
                                        subtitle="Pay instantly using any UPI app"
                                    />
                                ) : null}

                                {hasBank ? (
                                    <MethodCard
                                        active={activeMethod === 'bank'}
                                        onPress={() => setActiveMethod('bank')}
                                        icon="bank"
                                        title="Bank Transfer"
                                        subtitle="NEFT, IMPS, RTGS transfer supported"
                                    />
                                ) : null}

                                {!hasUpi && !hasBank ? (
                                    <View style={styles.emptyMethodBox}>
                                        <Icon
                                            name="alert-circle-outline"
                                            size={20}
                                            color={COLORS.danger}
                                        />
                                        <Text style={styles.emptyMethodText}>
                                            No payment method available.
                                        </Text>
                                    </View>
                                ) : null}
                            </View>

                            {activeMethod === 'upi' && hasUpi ? (
                                <View style={styles.previewPanel}>
                                    <View style={styles.previewHeaderRow}>
                                        <Icon
                                            name="qrcode-scan"
                                            size={18}
                                            color={COLORS.primary}
                                        />
                                        <Text style={styles.previewHeading}>UPI Payment Details</Text>
                                    </View>

                                    {!!config?.upi?.payeeName ? (
                                        <Text style={styles.previewMainValue}>
                                            {config.upi.payeeName}
                                        </Text>
                                    ) : null}

                                    <Text style={styles.previewSubValue}>{config?.upi?.upiId}</Text>
                                </View>
                            ) : null}

                            {activeMethod === 'bank' && hasBank ? (
                                <View style={styles.previewPanel}>
                                    <View style={styles.previewHeaderRow}>
                                        <Icon name="bank" size={18} color={COLORS.primary} />
                                        <Text style={styles.previewHeading}>Bank Account Preview</Text>
                                    </View>

                                    <Text style={styles.previewMainValue}>
                                        {config?.bank?.bankName || 'Bank Transfer'}
                                    </Text>

                                    {!!config?.bank?.accountHolderName ? (
                                        <Text style={styles.previewSubValue}>
                                            {config.bank.accountHolderName}
                                        </Text>
                                    ) : null}

                                    {!!config?.bank?.accountNumber ? (
                                        <Text style={styles.previewTinyText}>
                                            A/C: {config.bank.accountNumber}
                                        </Text>
                                    ) : null}
                                </View>
                            ) : null}

                            <View style={styles.infoCard}>
                                <Icon name="information-outline" size={18} color={COLORS.primary} />
                                <Text style={styles.infoCardText}>
                                    After payment, enter the UTR / reference number to submit your
                                    deposit request for verification.
                                </Text>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                ) : (
                    <KeyboardAvoidingView
                        style={styles.flex}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}>

                            {activeMethod === 'upi' && hasUpi ? (
                                <View style={styles.card}>
                                    <View style={styles.cardHeaderRow}>
                                        <View style={styles.cardHeaderLeft}>
                                            <View style={styles.iconRound}>
                                                <Icon
                                                    name="qrcode-scan"
                                                    size={20}
                                                    color={COLORS.primary}
                                                />
                                            </View>
                                            <Text style={styles.cardTitle}>UPI Payment Details</Text>
                                        </View>
                                    </View>

                                    <View style={styles.highlightBox}>
                                        {!!config?.upi?.payeeName ? (
                                            <Text style={styles.highlightLabel}>
                                                {config.upi.payeeName}
                                            </Text>
                                        ) : null}
                                        <Text style={styles.highlightValue}>
                                            {config?.upi?.upiId}
                                        </Text>
                                    </View>

                                    <CopyChip label="UPI ID" value={config?.upi?.upiId} />

                                    <View style={styles.divider} />

                                    <StepRow index={1} text="Open PhonePe, GPay, Paytm or any UPI app." />
                                    <StepRow
                                        index={2}
                                        text={`Send ₹${formatAmount(amount)} to the UPI ID above.`}
                                    />
                                    <StepRow
                                        index={3}
                                        text="Copy the UTR / transaction ID after successful payment."
                                    />
                                    <StepRow
                                        index={4}
                                        text="Enter the same UTR below and submit request."
                                    />
                                </View>
                            ) : null}

                            {activeMethod === 'bank' && hasBank ? (
                                <View style={styles.card}>
                                    <View style={styles.cardHeaderRow}>
                                        <View style={styles.cardHeaderLeft}>
                                            <View style={styles.iconRound}>
                                                <Icon name="bank" size={20} color={COLORS.primary} />
                                            </View>
                                            <Text style={styles.cardTitle}>Bank Account Details</Text>
                                        </View>
                                    </View>

                                    <View style={styles.bankBox}>
                                        <DetailRow
                                            label="Account Holder"
                                            value={config?.bank?.accountHolderName}
                                        />
                                        <DetailRow
                                            label="Account Number"
                                            value={config?.bank?.accountNumber}
                                            mono
                                            copyable
                                        />
                                        <DetailRow
                                            label="IFSC Code"
                                            value={config?.bank?.ifscCode}
                                            mono
                                            copyable
                                        />
                                        <DetailRow
                                            label="Bank Name"
                                            value={config?.bank?.bankName}
                                        />
                                        <DetailRow
                                            label="Branch"
                                            value={config?.bank?.branchName}
                                        />
                                        <DetailRow
                                            label="Account Type"
                                            value={config?.bank?.accountType}
                                            last
                                        />
                                    </View>

                                    <View style={styles.divider} />

                                    <StepRow index={1} text="Open your banking app or internet banking." />
                                    <StepRow
                                        index={2}
                                        text={`Transfer ₹${formatAmount(amount)} using the details above.`}
                                    />
                                    <StepRow index={3} text="Use NEFT, IMPS or RTGS as available." />
                                    <StepRow index={4} text="Copy the bank UTR / reference number." />
                                    <StepRow
                                        index={5}
                                        text="Enter it below and submit your request."
                                    />
                                </View>
                            ) : null}

                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Enter UTR / Reference Number</Text>
                                <Text style={styles.cardSubtext}>
                                    This is required to verify your payment and credit wallet balance.
                                </Text>

                                <TextInput
                                    style={styles.utrInput}
                                    value={utr}
                                    onChangeText={setUtr}
                                    placeholder="e.g. 425612345678"
                                    placeholderTextColor={COLORS.textDim}
                                    autoCapitalize="characters"
                                    maxLength={30}
                                    returnKeyType="done"
                                />

                                <View style={styles.helperBox}>
                                    <Icon
                                        name="information-outline"
                                        size={16}
                                        color={COLORS.primary}
                                    />
                                    <Text style={styles.helperText}>
                                        {activeMethod === 'upi'
                                            ? 'Find UTR in your UPI app transaction history.'
                                            : 'Find UTR / reference number in your bank transaction history.'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.warningCard}>
                                <Icon name="alert-outline" size={18} color={COLORS.warning} />
                                <Text style={styles.warningCardText}>
                                    Enter the exact amount and correct UTR. Wrong details can delay approval.
                                </Text>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                )}

                <SafeAreaView edges={['bottom']} style={styles.safeAreaBottom}>
                    <View style={styles.bottomBar}>
                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                (step === 1
                                    ? !amount || !activeMethod
                                    : !utr.trim() || isSubmitting) && styles.primaryButtonDisabled,
                            ]}
                            disabled={
                                step === 1
                                    ? !amount || !activeMethod
                                    : !utr.trim() || isSubmitting
                            }
                            onPress={step === 1 ? handleProceed : handleSubmit}
                            activeOpacity={0.85}>
                            {step === 2 && isSubmitting ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Icon
                                        name={step === 1 ? 'arrow-right-circle' : 'check-circle'}
                                        size={20}
                                        color="#FFFFFF"
                                    />
                                    <Text style={styles.primaryButtonText}>
                                        {step === 1
                                            ? `Proceed to Pay ₹${amount ? formatAmount(amount) : '0'}`
                                            : 'Submit Payment Request'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>

            <AppPopup
                visible={popup.visible}
                type={popup.type}
                title={popup.title}
                message={popup.message}
                amount={popup.amount}
                utrValue={popup.utrValue}
                method={popup.method}
                confirmText={popup.confirmText}
                cancelText={popup.cancelText}
                loading={popup.loading}
                onConfirm={popup.onConfirm}
                onCancel={popup.onCancel}
                onClose={popup.onClose}
            />
        </>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    safe: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    flex: {
        flex: 1,
    },
    safeAreaTop: {
        backgroundColor: COLORS.bg,
    },
    safeAreaBottom: {
        backgroundColor: COLORS.bg,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: BOTTOM_BAR_SPACE,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.bg,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        letterSpacing: 0.3,
    },

    centerState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    centerIconBox: {
        width: 74,
        height: 74,
        borderRadius: 22,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    centerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
    },
    centerSubtext: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 22,
    },
    retryBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 12,
    },
    retryBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },

    heroCard: {
        backgroundColor: COLORS.card,
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 20,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    heroGlow: {
        position: 'absolute',
        top: -20,
        right: -10,
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(0, 200, 150, 0.10)',
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    heroTopContent: {
        flex: 1,
        paddingRight: 12,
    },
    heroLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    heroTitle: {
        fontSize: 21,
        fontWeight: '800',
        color: COLORS.text,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primarySoft2,
        borderWidth: 1,
        borderColor: 'rgba(0, 200, 150, 0.25)',
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        flexShrink: 0,
    },
    heroBadgeText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },

    amountInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card2,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 18,
        paddingVertical: 12,
        marginBottom: 10,
    },
    currencySymbol: {
        fontSize: 30,
        fontWeight: '800',
        color: COLORS.primary,
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 42,
        fontWeight: '800',
        color: COLORS.text,
        padding: 0,
        letterSpacing: -1.5,
    },
    amountMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    amountMetaText: {
        fontSize: 12,
        color: COLORS.textDim,
        fontWeight: '500',
    },
    amountHint: {
        fontSize: 12,
        color: COLORS.primary,
        marginTop: 10,
        fontWeight: '600',
    },

    section: {
        paddingHorizontal: 16,
        marginBottom: 22,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
    },

    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    quickChip: {
        width: '31%',
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        marginBottom: 10,
    },
    quickChipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    quickChipText: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '700',
    },
    quickChipTextSelected: {
        color: '#FFFFFF',
    },

    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 14,
        marginBottom: 12,
    },
    methodCardActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primarySoft2,
    },
    methodIconWrap: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.blueTint,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    methodIconWrapActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    methodTextWrap: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    methodTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 3,
    },
    methodSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        lineHeight: 18,
    },
    methodSubtitleActive: {
        color: '#D8FFF5',
    },

    emptyMethodBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.dangerBg,
        borderWidth: 1,
        borderColor: 'rgba(255,107,107,0.2)',
        borderRadius: 12,
        padding: 14,
    },
    emptyMethodText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.danger,
        fontWeight: '500',
        marginLeft: 8,
    },

    previewPanel: {
        backgroundColor: COLORS.card,
        marginHorizontal: 16,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: 16,
    },
    previewHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    previewHeading: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
        marginLeft: 8,
    },
    previewMainValue: {
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '700',
        marginBottom: 4,
    },
    previewSubValue: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '600',
    },
    previewTinyText: {
        marginTop: 6,
        fontSize: 12,
        color: COLORS.textMuted,
    },

    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.card,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginHorizontal: 16,
    },
    infoCardText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.textMuted,
        lineHeight: 20,
        fontWeight: '500',
        marginLeft: 10,
    },

    bottomBar: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.card,
        backgroundColor: COLORS.bg,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        minHeight: 56,
    },
    primaryButtonDisabled: {
        backgroundColor: '#2A2A2A',
    },
    primaryButtonText: {
        flexShrink: 1,
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2,
        marginLeft: 8,
    },

    summaryCard: {
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 16,
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        padding: 18,
        overflow: 'hidden',
    },
    summaryGlow: {
        position: 'absolute',
        top: -10,
        right: -20,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.10)',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#D8FFF5',
        fontWeight: '600',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    summaryAmount: {
        fontSize: 28,
        color: '#FFFFFF',
        fontWeight: '800',
        marginBottom: 4,
    },
    summaryMethod: {
        fontSize: 13,
        color: '#E7FFF9',
        fontWeight: '600',
    },

    card: {
        backgroundColor: COLORS.card,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconRound: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: COLORS.blueTint,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        flexShrink: 1,
    },
    cardSubtext: {
        fontSize: 13,
        color: COLORS.textMuted,
        lineHeight: 20,
        marginBottom: 12,
        marginTop: 8,
    },

    highlightBox: {
        backgroundColor: COLORS.card2,
        borderWidth: 1,
        borderColor: COLORS.borderSoft,
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    highlightLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    highlightValue: {
        fontSize: 19,
        fontWeight: '800',
        color: COLORS.primary,
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },

    copyChip: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: '100%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: COLORS.card2,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    copyChipActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primarySoft,
    },
    copyChipText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textMuted,
        marginLeft: 6,
        flexShrink: 1,
    },
    copyChipTextActive: {
        color: COLORS.primary,
    },

    bankBox: {
        backgroundColor: COLORS.card2,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    detailRow: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderSoft,
    },
    detailRowLast: {
        borderBottomWidth: 0,
    },
    detailLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '600',
        marginBottom: 6,
    },
    detailRight: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    detailActionWrap: {
        maxWidth: '55%',
        marginLeft: 10,
    },
    detailValue: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '700',
    },
    monoText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        letterSpacing: 0.5,
    },

    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        paddingRight: 2,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        marginTop: 1,
    },
    stepNumberText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    stepText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
        color: COLORS.textMuted,
        fontWeight: '500',
    },

    utrInput: {
        backgroundColor: COLORS.inputBg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 16,
        color: COLORS.text,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        letterSpacing: 1,
        marginBottom: 10,
        marginTop: 12,
    },
    helperBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.card2,
        borderWidth: 1,
        borderColor: COLORS.borderSoft,
        borderRadius: 10,
        padding: 10,
    },
    helperText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.textDim,
        lineHeight: 18,
        fontWeight: '500',
        marginLeft: 8,
    },

    warningCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.warningBg,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.warningBorder,
        marginHorizontal: 16,
        marginBottom: 0,
    },
    warningCardText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.warning,
        lineHeight: 20,
        fontWeight: '500',
        marginLeft: 10,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalCard: {
        backgroundColor: COLORS.card,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.card2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        zIndex: 2,
    },
    modalIconWrap: {
        width: 84,
        height: 84,
        borderRadius: 42,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginBottom: 16,
        marginTop: 8,
    },
    modalIconInner: {
        width: 62,
        height: 62,
        borderRadius: 31,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 13,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
    modalInfoCard: {
        backgroundColor: COLORS.card2,
        borderWidth: 1,
        borderColor: COLORS.borderSoft,
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
    },
    modalInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderSoft,
    },
    modalInfoRowLast: {
        borderBottomWidth: 0,
    },
    modalInfoLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    modalInfoValue: {
        fontSize: 13,
        color: COLORS.text,
        fontWeight: '700',
        maxWidth: '62%',
        textAlign: 'right',
    },
    modalMono: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    modalBottomNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.primarySoft2,
        borderWidth: 1,
        borderColor: 'rgba(0, 200, 150, 0.18)',
        borderRadius: 14,
        padding: 12,
        marginBottom: 18,
    },
    modalBottomNoteText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
        color: '#D7FFF3',
        fontWeight: '600',
        marginLeft: 8,
    },
    modalButtonRow: {
        flexDirection: 'row',
    },
    modalSecondaryBtn: {
        flex: 1,
        backgroundColor: COLORS.card2,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    modalSecondaryBtnText: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '700',
    },
    modalPrimaryBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 14,
    },
    modalPrimaryBtnFull: {
        flex: 1,
    },
    modalPrimaryBtnDisabled: {
        opacity: 0.7,
    },
    modalPrimaryBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        marginLeft: 8,
    },
});

export default PaymentScreen;