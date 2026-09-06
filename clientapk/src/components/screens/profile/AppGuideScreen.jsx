import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const COLORS = {
    bg: '#000000',
    surface: '#141414',
    surface2: '#1A1A1A',
    card: '#171717',
    border: '#2A2A2A',
    borderSoft: '#222222',
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textTertiary: '#6B7280',
    white: '#FFFFFF',
    primary: '#00C896',
    primarySoft: 'rgba(0, 200, 150, 0.14)',
    primaryUltraSoft: 'rgba(0, 200, 150, 0.08)',
    success: '#22C55E',
    successSoft: 'rgba(34, 197, 94, 0.12)',
    warning: '#F59E0B',
    warningSoft: 'rgba(245, 158, 11, 0.12)',
    error: '#FF5252',
    errorSoft: 'rgba(255, 82, 82, 0.12)',
    info: '#38BDF8',
    infoSoft: 'rgba(56, 189, 248, 0.12)',
};

const GUIDE_SECTIONS = [
    {
        id: '1',
        title: 'Account Setup',
        subtitle: 'Create account and prepare wallet access.',
        icon: 'rocket-launch',
        iconColor: COLORS.primary,
        steps: [
            {
                step: 'Sign Up with Phone Number',
                description:
                    'Create your TradeHub account using your mobile number and complete OTP verification to access the app securely.',
            },
        ],
    },
    {
        id: '2',
        title: 'Add Money to Wallet',
        subtitle: 'Wallet funding is required before placing trades.',
        icon: 'wallet-plus',
        iconColor: COLORS.success,
        steps: [
            {
                step: 'Open Wallet',
                description:
                    'Go to the wallet section from the app navigation to see your available balance and funding actions.',
            },
            {
                step: 'Enter Amount',
                description:
                    'Enter the amount you want to add. TradeHub trading flow generally expects a minimum ₹500 balance to start trading properly.',
            },
            {
                step: 'Complete Payment',
                description:
                    'Pay using your supported payment method such as UPI or banking option provided in the app.',
            },
            {
                step: 'Submit UTR Number',
                description:
                    'After payment, enter the UTR or transaction reference number carefully. Without this step, the wallet amount may not be credited for review and approval.',
            },
            {
                step: 'Wait for Wallet Credit',
                description:
                    'Once your payment and UTR are checked, the amount is reflected in your wallet balance and becomes available for trading.',
            },
        ],
    },
    {
        id: '3',
        title: 'Explore the Market',
        subtitle: 'Use the home screen to review tradable indices and price movement.',
        icon: 'chart-line',
        iconColor: COLORS.info,
        steps: [
            {
                step: 'Open Home Screen',
                description:
                    'The home screen shows market highlights, banners, and a list of top indices or market instruments available in the app.',
            },
            {
                step: 'Review Price Data',
                description:
                    'Check current value, change percentage, daily movement and available details before selecting any instrument.',
            },
            {
                step: 'Open Instrument Details',
                description:
                    'Tap a stock or index card to review more detailed information such as price movement, day high, day low and other supported trade information.',
            },
        ],
    },
    {
        id: '4',
        title: 'Place a Trade',
        subtitle: 'Trade using wallet balance with minimum amount rules.',
        icon: 'finance',
        iconColor: COLORS.primary,
        steps: [
            {
                step: 'Choose an Index or Stock',
                description:
                    'Select the market instrument you want to trade after reviewing price and movement information on the app.',
            },
            {
                step: 'Enter Trade Amount',
                description:
                    'Input the amount you want to invest using the trade screen. Minimum trade amount should remain ₹500 or above based on your current business rule.',
            },
            {
                step: 'Review Order Summary',
                description:
                    'Before confirming, check the amount, selected instrument and available wallet balance to avoid rejected trades.',
            },
            {
                step: 'Confirm Buy',
                description:
                    'Once confirmed, the system executes the order and adjusts your wallet and holdings according to the trade result.',
            },
        ],
    },
    {
        id: '5',
        title: 'Trading Rules',
        subtitle: 'Important rules users should understand before trading.',
        icon: 'shield-check',
        iconColor: COLORS.warning,
        steps: [
            {
                step: 'Minimum Trade Amount',
                description:
                    'Trades below ₹500 should not be placed because the business flow uses ₹500 as the minimum trading threshold.',
            },
            {
                step: 'Sufficient Wallet Balance',
                description:
                    'A trade can only go through if the wallet contains enough available balance for the requested order amount.',
            },
            {
                step: 'Wallet Updates After Trade',
                description:
                    'After a trade is processed, the wallet and transaction history should reflect the debit, credit, profit or loss based on the trade outcome.',
            },
            {
                step: 'Read Market Carefully',
                description:
                    'Price movement can change quickly, so users should review details properly before executing any action.',
            },
        ],
    },
    {
        id: '6',
        title: 'Portfolio and Holdings',
        subtitle: 'Track investments, value and performance in one place.',
        icon: 'briefcase-variant',
        iconColor: COLORS.primary,
        steps: [
            {
                step: 'Open Portfolio',
                description:
                    'Visit the portfolio section to review your active positions and invested instruments.',
            },
            {
                step: 'Track Performance',
                description:
                    'Monitor invested value, current value and overall profit or loss from your holdings.',
            },
            {
                step: 'Inspect Individual Holdings',
                description:
                    'Each holding can be reviewed separately to better understand performance and take further trading action when needed.',
            },
            {
                step: 'Manage Positions',
                description:
                    'Use the holding details to decide whether to continue holding or exit a position based on market behavior.',
            },
        ],
    },
    {
        id: '7',
        title: 'Withdraw Funds',
        subtitle: 'Withdraw money only after bank details are ready and verified.',
        icon: 'bank-transfer-out',
        iconColor: COLORS.error,
        steps: [
            {
                step: 'Go to Wallet',
                description:
                    'Open the wallet screen and choose the withdrawal option when you want to transfer available balance to your bank account.',
            },
            {
                step: 'Enter Withdrawal Amount',
                description:
                    'Enter the amount to withdraw. Make sure the requested amount follows your app rules and available wallet balance.',
            },
            {
                step: 'Verify Bank Account',
                description:
                    'Withdrawals should only be sent to the bank details already submitted and verified in your account.',
            },
            {
                step: 'Processing Time',
                description:
                    'After request submission, the transfer may take business processing time before it reaches the linked bank account.',
            },
        ],
    },
    {
        id: '8',
        title: 'Transaction History',
        subtitle: 'Review add money, withdrawal, debit, credit and trade-related records.',
        icon: 'history',
        iconColor: COLORS.info,
        steps: [
            {
                step: 'Open Transaction History',
                description:
                    'Users can inspect their past wallet and trade activity from the transaction history screen.',
            },
            {
                step: 'Use Search and Filters',
                description:
                    'Credit, debit, withdrawal and pending filters help users quickly locate the right transaction.',
            },
            {
                step: 'Check UTR and Bank Details',
                description:
                    'For wallet funding and withdrawal records, the user can review UTR references and related bank information where applicable.',
            },
            {
                step: 'No Signup Bonus Flow',
                description:
                    'This guide intentionally excludes signup bonus logic so the screen matches your current TradeHub business flow and UI direction.',
            },
        ],
    },
];

const QUICK_STATS = [];

const QUICK_TIPS = [
    'Always submit the correct UTR after adding money.',
    'Maintain enough wallet balance before placing a trade.',
    'Check bank details carefully before requesting withdrawal.',
    'Review market movement before confirming any order.',
    'Use transaction history filters to verify credits, debits and pending entries.',
];

const AppGuideScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const compact = width < 380;
    const [expandedSection, setExpandedSection] = useState('1');

    const toggleSection = (id) => {
        setExpandedSection((previous) =>
            previous === id ? null : id
        );
    };

    const contentMaxWidth = useMemo(() => {
        if (width >= 768) return 760;
        return '100%';
    }, [width]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={[styles.header, compact && styles.headerCompact]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.8}
                    >
                        <Icon name="arrow-left" size={22} color={COLORS.text} />
                    </TouchableOpacity>

                    <Text
                        style={[
                            styles.headerTitle,
                            compact && styles.headerTitleCompact,
                        ]}
                        numberOfLines={1}
                    >
                        TradeHub Guide
                    </Text>

                    <View style={styles.headerRight} />
                </View>
            </SafeAreaView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={[styles.contentWrap, { maxWidth: contentMaxWidth }]}>
                    <View style={[styles.heroCard, compact && styles.heroCardCompact]}>
                        <View style={styles.heroTopRow}>
                            <View style={styles.heroIconWrap}>
                                <Icon
                                    name="book-open-page-variant"
                                    size={30}
                                    color={COLORS.primary}
                                />
                            </View>

                            <View style={styles.heroBadge}>
                                <Icon
                                    name="shield-check"
                                    size={14}
                                    color={COLORS.primary}
                                />
                                <Text style={styles.heroBadgeText}>
                                    Trading Flow Guide
                                </Text>
                            </View>
                        </View>

                        <Text
                            style={[
                                styles.heroTitle,
                                compact && styles.heroTitleCompact,
                            ]}
                        >
                            Learn how TradeHub works from wallet funding to withdrawal
                        </Text>
                    </View>

                    <View style={styles.statsRow}>
                        {QUICK_STATS.map((item) => (
                            <View key={item.id} style={styles.statCard}>
                                <View
                                    style={[
                                        styles.statIconWrap,
                                        { backgroundColor: item.bg },
                                    ]}
                                >
                                    <Icon
                                        name={item.icon}
                                        size={18}
                                        color={item.color}
                                    />
                                </View>
                                <Text style={styles.statValue}>{item.value}</Text>
                                <Text style={styles.statLabel}>{item.label}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.noticeCard}>
                        <View style={styles.noticeIconWrap}>
                            <Icon
                                name="alert-circle"
                                size={22}
                                color={COLORS.error}
                            />
                        </View>
                        <View style={styles.noticeContent}>
                            <Text style={styles.noticeTitle}>
                                Important UTR Notice
                            </Text>
                            <Text style={styles.noticeText}>
                                After adding money, users must submit the correct UTR or
                                transaction reference. Without UTR verification, wallet
                                credit may not be processed.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.sectionIntro}>
                        <Text style={styles.sectionIntroTitle}>Guide Sections</Text>
                        <Text style={styles.sectionIntroText}>
                            Open each section to understand the complete user flow inside
                            TradeHub.
                        </Text>
                    </View>

                    {GUIDE_SECTIONS.map((section) => {
                        const expanded = expandedSection === section.id;

                        return (
                            <TouchableOpacity
                                key={section.id}
                                style={[
                                    styles.sectionCard,
                                    expanded && styles.sectionCardExpanded,
                                ]}
                                onPress={() => toggleSection(section.id)}
                                activeOpacity={0.86}
                            >
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionHeaderLeft}>
                                        <View
                                            style={[
                                                styles.sectionIcon,
                                                {
                                                    backgroundColor: `${section.iconColor}16`,
                                                },
                                            ]}
                                        >
                                            <Icon
                                                name={section.icon}
                                                size={22}
                                                color={section.iconColor}
                                            />
                                        </View>

                                        <View style={styles.sectionTextWrap}>
                                            <Text style={styles.sectionTitle}>
                                                {section.title}
                                            </Text>
                                            <Text style={styles.sectionSubtitle}>
                                                {section.subtitle}
                                            </Text>
                                        </View>
                                    </View>

                                    <View
                                        style={[
                                            styles.chevronWrap,
                                            expanded && styles.chevronWrapExpanded,
                                        ]}
                                    >
                                        <Icon
                                            name={
                                                expanded
                                                    ? 'chevron-up'
                                                    : 'chevron-down'
                                            }
                                            size={20}
                                            color={
                                                expanded
                                                    ? COLORS.primary
                                                    : COLORS.textSecondary
                                            }
                                        />
                                    </View>
                                </View>

                                {expanded && (
                                    <View style={styles.sectionContent}>
                                        {section.steps.map((step, index) => (
                                            <View
                                                key={`${section.id}-${index}`}
                                                style={[
                                                    styles.stepItem,
                                                    index === section.steps.length - 1 &&
                                                    styles.stepItemLast,
                                                ]}
                                            >
                                                <View style={styles.stepLeftColumn}>
                                                    <View style={styles.stepNumber}>
                                                        <Text style={styles.stepNumberText}>
                                                            {index + 1}
                                                        </Text>
                                                    </View>
                                                    {index !== section.steps.length - 1 && (
                                                        <View style={styles.stepLine} />
                                                    )}
                                                </View>

                                                <View style={styles.stepContent}>
                                                    <Text style={styles.stepTitle}>
                                                        {step.step}
                                                    </Text>
                                                    <Text style={styles.stepDescription}>
                                                        {step.description}
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}

                    <View style={styles.tipsCard}>
                        <View style={styles.tipsHeader}>
                            <View style={styles.tipsHeaderIcon}>
                                <Icon
                                    name="lightbulb-on-outline"
                                    size={20}
                                    color={COLORS.warning}
                                />
                            </View>
                            <Text style={styles.tipsTitle}>Quick Tips</Text>
                        </View>

                        {QUICK_TIPS.map((tip, index) => (
                            <View key={index} style={styles.tipRow}>
                                <Icon
                                    name="check-circle"
                                    size={18}
                                    color={COLORS.success}
                                />
                                <Text style={styles.tipText}>{tip}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
                <View
                    style={[
                        styles.fixedSupportOuter,
                        { maxWidth: contentMaxWidth },
                    ]}
                >
                    <View style={styles.supportCard}>
                        <View style={styles.supportLeft}>
                            <View style={styles.supportIconWrap}>
                                <Icon
                                    name="headset"
                                    size={22}
                                    color={COLORS.primary}
                                />
                            </View>

                            <View style={styles.supportTextWrap}>
                                <Text style={styles.supportTitle}>Need Help?</Text>
                                <Text
                                    style={styles.supportText}
                                    numberOfLines={2}
                                >
                                    Reach Customer Support.
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.supportButton}
                            onPress={() => navigation.navigate('ChatSupport')}
                            activeOpacity={0.82}
                        >
                            <Text style={styles.supportButtonText}>Open</Text>
                            <Icon
                                name="chevron-right"
                                size={18}
                                color="#00150F"
                            />
                        </TouchableOpacity>
                    </View>
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
    safeArea: {
        backgroundColor: COLORS.bg,
    },
    bottomSafeArea: {
        backgroundColor: COLORS.bg,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderSoft,
    },
    header: {
        backgroundColor: COLORS.bg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderSoft,
    },
    headerCompact: {
        paddingBottom: 8,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 17,
        fontWeight: '800',
        color: COLORS.text,
        marginHorizontal: 12,
        letterSpacing: 0.2,
    },
    headerTitleCompact: {
        fontSize: 16,
    },
    headerRight: {
        width: 40,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 24,
        alignItems: 'center',
    },
    contentWrap: {
        width: '100%',
    },
    fixedSupportOuter: {
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    heroCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 14,
    },
    heroCardCompact: {
        padding: 16,
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    heroIconWrap: {
        width: 54,
        height: 54,
        borderRadius: 16,
        backgroundColor: COLORS.primaryUltraSoft,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 200, 150, 0.22)',
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: COLORS.primaryUltraSoft,
        borderWidth: 1,
        borderColor: 'rgba(0, 200, 150, 0.22)',
    },
    heroBadgeText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '700',
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.text,
        lineHeight: 30,
        marginBottom: 10,
    },
    heroTitleCompact: {
        fontSize: 20,
        lineHeight: 27,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 14,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontWeight: '600',
        textAlign: 'center',
    },
    noticeCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.errorSoft,
        padding: 15,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 82, 82, 0.34)',
    },
    noticeIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 82, 82, 0.10)',
        marginRight: 12,
    },
    noticeContent: {
        flex: 1,
    },
    noticeTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.error,
        marginBottom: 4,
    },
    noticeText: {
        fontSize: 12.5,
        color: '#FFB4B4',
        lineHeight: 18,
        fontWeight: '500',
    },
    sectionIntro: {
        marginBottom: 12,
        paddingHorizontal: 2,
    },
    sectionIntroTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 4,
    },
    sectionIntroText: {
        fontSize: 12.5,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    sectionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sectionCardExpanded: {
        borderColor: 'rgba(0, 200, 150, 0.40)',
        backgroundColor: COLORS.surface2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 10,
    },
    sectionIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    sectionTextWrap: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 3,
    },
    sectionSubtitle: {
        fontSize: 11.5,
        color: COLORS.textSecondary,
        lineHeight: 16,
        fontWeight: '500',
    },
    chevronWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    chevronWrapExpanded: {
        backgroundColor: COLORS.primaryUltraSoft,
        borderColor: 'rgba(0, 200, 150, 0.28)',
    },
    sectionContent: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderSoft,
    },
    stepItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    stepItemLast: {
        marginBottom: 2,
    },
    stepLeftColumn: {
        width: 34,
        alignItems: 'center',
        marginRight: 10,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#00150F',
    },
    stepLine: {
        width: 1.5,
        flex: 1,
        backgroundColor: COLORS.border,
        marginTop: 6,
        minHeight: 24,
    },
    stepContent: {
        flex: 1,
        paddingTop: 2,
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: 12.5,
        color: COLORS.textSecondary,
        lineHeight: 18,
        fontWeight: '500',
    },
    tipsCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginTop: 2,
        marginBottom: 14,
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    tipsHeaderIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.warningSoft,
        marginRight: 10,
    },
    tipsTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.text,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 12,
    },
    tipText: {
        flex: 1,
        fontSize: 12.8,
        color: COLORS.textSecondary,
        lineHeight: 18,
        fontWeight: '500',
    },
    supportCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    supportLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 12,
    },
    supportIconWrap: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primaryUltraSoft,
        borderWidth: 1,
        borderColor: 'rgba(0, 200, 150, 0.24)',
        marginRight: 12,
    },
    supportTextWrap: {
        flex: 1,
    },
    supportTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 2,
    },
    supportText: {
        fontSize: 12.5,
        color: COLORS.textSecondary,
        lineHeight: 18,
        fontWeight: '500',
    },
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    supportButtonText: {
        fontSize: 12.5,
        fontWeight: '800',
        color: '#00150F',
        marginRight: 2,
    },
});

export default AppGuideScreen;