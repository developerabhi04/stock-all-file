import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const PRESET_AMOUNTS = [2000, 5000, 10000, 20000, 50000, 100000, 250000];

const COLORS = {
    bg: '#000000',
    surface: '#171717',
    surfaceSoft: '#1A1A1A',
    border: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#999999',
    textMuted: '#666666',
    primary: '#00C896',
    primarySoft: 'rgba(0, 200, 150, 0.14)',
    buttonDisabled: '#2A2A2A',
    skeletonBase: '#1F1F1F',
    skeletonHighlight: '#2B2B2B',
};

const RechargeScreen = ({ navigation }) => {
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [customAmount, setCustomAmount] = useState('');
    const [loading, setLoading] = useState(true);

    const pulseAnim = useRef(new Animated.Value(0.45)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 900);

        return () => clearTimeout(timer);
    }, []);

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

        if (loading) {
            loop.start();
        }

        return () => {
            loop.stop();
        };
    }, [loading, pulseAnim]);

    const skeletonAnimatedStyle = useMemo(() => {
        const opacity = pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.45, 1],
        });

        return { opacity };
    }, [pulseAnim]);

    const amountToUse = customAmount ? Number(customAmount) : selectedAmount;

    const handleAmountSelect = (amount) => {
        setSelectedAmount(amount);
        setCustomAmount(amount.toString());
    };

    const handleRecharge = () => {
        if (!amountToUse || amountToUse <= 0) return;
        navigation.navigate('Payment', { amount: amountToUse });
    };

    const SkeletonBlock = ({ width, height, radius = 10, style }) => (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius: radius,
                    backgroundColor: COLORS.skeletonBase,
                },
                skeletonAnimatedStyle,
                style,
            ]}
        />
    );

    const RechargeSkeleton = () => (
        <>
            <View style={styles.amountCard}>
                <SkeletonBlock width={90} height={12} radius={6} style={{ marginBottom: 14 }} />

                <View style={styles.amountInputContainer}>
                    <SkeletonBlock width={20} height={30} radius={6} style={{ marginRight: 8 }} />
                    <SkeletonBlock width="65%" height={42} radius={8} />
                </View>

                <SkeletonBlock width="72%" height={11} radius={6} style={{ marginTop: 10 }} />
            </View>

            <View style={styles.quickAmountSection}>
                <SkeletonBlock width={100} height={15} radius={7} style={{ marginBottom: 12 }} />

                <View style={styles.quickAmountGrid}>
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <SkeletonBlock
                            key={`quick-skeleton-${item}`}
                            width="31%"
                            height={46}
                            radius={10}
                            style={styles.quickAmountSkeleton}
                        />
                    ))}
                </View>
            </View>
        </>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

            <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-left" size={22} color={COLORS.text} />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Add Money</Text>

                    <View style={styles.headerSpacer} />
                </View>
            </SafeAreaView>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {loading ? (
                        <RechargeSkeleton />
                    ) : (
                        <>
                            <View style={styles.amountCard}>
                                <Text style={styles.amountLabel}>Enter Amount</Text>

                                <View style={styles.amountInputContainer}>
                                    <Text style={styles.currencySymbol}>₹</Text>

                                    <TextInput
                                        style={styles.amountInput}
                                        placeholder="0"
                                        placeholderTextColor={COLORS.textMuted}
                                        keyboardType="numeric"
                                        value={customAmount}
                                        onChangeText={(text) => {
                                            setCustomAmount(text.replace(/[^0-9]/g, ''));
                                            setSelectedAmount(null);
                                        }}
                                        maxLength={7}
                                    />
                                </View>

                                {amountToUse > 0 && (
                                    <Text style={styles.amountHint}>
                                        You will add ₹{amountToUse.toLocaleString('en-IN')} to your wallet
                                    </Text>
                                )}
                            </View>

                            <View style={styles.quickAmountSection}>
                                <Text style={styles.quickAmountTitle}>Quick Amount</Text>

                                <View style={styles.quickAmountGrid}>
                                    {PRESET_AMOUNTS.map((amount) => {
                                        const isSelected = selectedAmount === amount;

                                        return (
                                            <TouchableOpacity
                                                key={amount}
                                                style={[
                                                    styles.quickAmountButton,
                                                    isSelected && styles.quickAmountButtonSelected,
                                                ]}
                                                onPress={() => handleAmountSelect(amount)}
                                                activeOpacity={0.8}
                                            >
                                                <Text
                                                    style={[
                                                        styles.quickAmountText,
                                                        isSelected && styles.quickAmountTextSelected,
                                                    ]}
                                                >
                                                    ₹{amount.toLocaleString('en-IN')}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            <SafeAreaView edges={['bottom']} style={styles.safeAreaBottom}>
                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        style={[
                            styles.addMoneyButton,
                            (!amountToUse || amountToUse <= 0 || loading) &&
                            styles.addMoneyButtonDisabled,
                        ]}
                        disabled={!amountToUse || amountToUse <= 0 || loading}
                        onPress={handleRecharge}
                        activeOpacity={0.85}
                    >
                        <Icon name="plus-circle" size={18} color={COLORS.text} />
                        <Text style={styles.addMoneyButtonText}>
                            {amountToUse && !loading
                                ? `Add ₹${amountToUse.toLocaleString('en-IN')}`
                                : 'Enter Amount'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },

    flex: {
        flex: 1,
    },

    safeAreaTop: {
        backgroundColor: COLORS.bg,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: COLORS.bg,
        borderBottomWidth: 1,
        borderBottomColor: '#111111',
    },

    backButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
    },

    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: 0.2,
    },

    headerSpacer: {
        width: 38,
        height: 38,
    },

    scrollView: {
        flex: 1,
    },

    scrollContent: {
        paddingBottom: 20,
    },

    amountCard: {
        backgroundColor: COLORS.surfaceSoft,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 18,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    amountLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1.5,
        borderBottomColor: COLORS.primary,
        paddingBottom: 8,
        marginBottom: 10,
    },

    currencySymbol: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textMuted,
        marginRight: 8,
    },

    amountInput: {
        flex: 1,
        fontSize: 34,
        fontWeight: '900',
        color: COLORS.text,
        padding: 0,
        letterSpacing: -1,
    },

    amountHint: {
        fontSize: 11,
        color: COLORS.primary,
        marginTop: 2,
        fontWeight: '600',
    },

    quickAmountSection: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },

    quickAmountTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 12,
    },

    quickAmountGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    quickAmountButton: {
        width: '31%',
        backgroundColor: COLORS.surfaceSoft,
        paddingVertical: 13,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 10,
    },

    quickAmountSkeleton: {
        marginBottom: 10,
    },

    quickAmountButtonSelected: {
        backgroundColor: COLORS.primarySoft,
        borderColor: COLORS.primary,
    },

    quickAmountText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
    },

    quickAmountTextSelected: {
        color: COLORS.primary,
    },

    safeAreaBottom: {
        backgroundColor: COLORS.bg,
    },

    bottomSection: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 12,
        backgroundColor: COLORS.bg,
        borderTopWidth: 1,
        borderTopColor: '#111111',
    },

    addMoneyButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 12,
        gap: 8,
    },

    addMoneyButtonDisabled: {
        backgroundColor: COLORS.buttonDisabled,
    },

    addMoneyButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: 0.2,
    },
});

export default RechargeScreen;