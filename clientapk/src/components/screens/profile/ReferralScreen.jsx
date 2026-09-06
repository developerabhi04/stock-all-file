import React, { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';

import ApiService from '../../../services/ApiService';

const COLORS = {
  background: '#000000',
  surface: '#1A1A1A',
  surfaceAlt: '#141414',
  border: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#999999',
  textMuted: '#666666',
  primary: '#00C896',
  primarySoft: 'rgba(0, 200, 150, 0.15)',
  blue: '#2196F3',
  blueSoft: 'rgba(33, 150, 243, 0.15)',
  warning: '#FF9800',
  warningSoft: 'rgba(255, 152, 0, 0.15)',
  danger: '#FF5252',
  dangerSoft: 'rgba(255, 82, 82, 0.15)',
};

const formatCurrency = value => {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
};

const formatDate = value => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getReferralStatusLabel = status => {
  if (status === 'rewarded') {
    return 'Rewarded';
  }

  if (status === 'expired') {
    return 'Expired';
  }

  return 'Pending';
};

const getReferralStatusColor = status => {
  if (status === 'rewarded') {
    return COLORS.primary;
  }

  if (status === 'expired') {
    return COLORS.danger;
  }

  return COLORS.warning;
};

const ReferralScreen = ({ navigation }) => {
  const [referralInfo, setReferralInfo] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedType, setCopiedType] = useState('');

  const loadReferralData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [infoResponse, historyResponse] = await Promise.all([
        ApiService.getMyReferralInfo(),
        ApiService.getMyReferralHistory(1, 50),
      ]);

      if (infoResponse?.success) {
        setReferralInfo(infoResponse.data || null);
      } else {
        throw new Error(
          infoResponse?.message || 'Unable to load referral information',
        );
      }

      if (historyResponse?.success) {
        const historyData = historyResponse.data || {};

        setReferrals(
          Array.isArray(historyData.referrals) ? historyData.referrals : [],
        );
      } else {
        setReferrals([]);
        console.error('Referral history error:', historyResponse?.message);
      }
    } catch (error) {
      console.error(
        '❌ Referral data loading failed:',
        error?.message || error,
      );

      if (!isRefresh) {
        Alert.alert(
          'Unable to load referrals',
          'Please check your connection and try again.',
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReferralData(false);
    }, [loadReferralData]),
  );

  const handleRefresh = useCallback(() => {
    loadReferralData(true);
  }, [loadReferralData]);

  const copyToClipboard = useCallback((value, type) => {
    if (!value) {
      return;
    }

    Clipboard.setString(value);
    setCopiedType(type);

    setTimeout(() => {
      setCopiedType('');
    }, 1800);
  }, []);

  const handleShare = useCallback(async () => {
    if (!referralInfo?.referralCode) {
      Alert.alert('Referral code unavailable', 'Please refresh and try again.');
      return;
    }

    const referralCode = referralInfo.referralCode;
    const shareLink = referralInfo.shareLink || '';

    const minimumRecharge = referralInfo.minRechargeRequired || 5000;

    const rewardAmount = referralInfo.rewardPerReferral || 1000;

    const message =
      `Join me on TradeHub and start investing.\n\n` +
      `Use my referral code: ${referralCode}\n\n` +
      `Download the app: ${shareLink}\n\n` +
      `After your first approved recharge of ₹${Number(
        minimumRecharge,
      ).toLocaleString('en-IN')} or more, ` +
      `both of us receive ₹${Number(rewardAmount).toLocaleString('en-IN')}.`;

    try {
      await Share.share({
        message,
        title: 'Invite friends to TradeHub',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [referralInfo]);

  const referralCode = referralInfo?.referralCode || 'Loading...';
  const shareLink = referralInfo?.shareLink || '';
  const rewardAmount = referralInfo?.rewardPerReferral || 1000;
  const minimumRecharge = referralInfo?.minRechargeRequired || 5000;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Icon name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Refer & Earn</Text>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => loadReferralData(true)}
            activeOpacity={0.8}
          >
            <Icon name="refresh" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading && !referralInfo ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading referral details...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          <View style={styles.heroSection}>
            <View style={styles.heroIconContainer}>
              <Icon name="gift-outline" size={52} color={COLORS.primary} />
            </View>

            <Text style={styles.heroTitle}>Invite & Earn</Text>

            <Text style={styles.heroSubtitle}>
              Invite your friends to TradeHub and both of you can receive wallet
              rewards.
            </Text>
          </View>

          <View style={styles.rewardCard}>
            <View style={styles.rewardIconContainer}>
              <Icon name="cash-multiple" size={28} color={COLORS.primary} />
            </View>

            <View style={styles.rewardTextContainer}>
              <Text style={styles.rewardLabel}>
                Reward per successful referral
              </Text>

              <Text style={styles.rewardAmount}>
                {formatCurrency(rewardAmount)}
              </Text>

              <Text style={styles.rewardDescription}>
                Both users receive this amount after the first approved recharge
                of {formatCurrency(minimumRecharge)} or more.
              </Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {referralInfo?.totalInvited || 0}
              </Text>
              <Text style={styles.statLabel}>Invited</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {referralInfo?.totalRewarded || 0}
              </Text>
              <Text style={styles.statLabel}>Rewarded</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatCurrency(referralInfo?.totalEarned || 0)}
              </Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your referral code</Text>

            <View style={styles.copyRow}>
              <View style={styles.codeBox}>
                <Icon name="key-outline" size={20} color={COLORS.primary} />

                <Text style={styles.codeText} numberOfLines={1}>
                  {referralCode}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(referralCode, 'code')}
                activeOpacity={0.8}
              >
                <Icon
                  name={copiedType === 'code' ? 'check' : 'content-copy'}
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>

            {shareLink ? (
              <View style={styles.copyRow}>
                <View style={styles.linkBox}>
                  <Icon name="link-variant" size={20} color={COLORS.blue} />

                  <Text style={styles.linkText} numberOfLines={1}>
                    {shareLink}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.linkCopyButton}
                  onPress={() => copyToClipboard(shareLink, 'link')}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={copiedType === 'link' ? 'check' : 'content-copy'}
                    size={20}
                    color={COLORS.blue}
                  />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Icon name="share-variant" size={21} color="#FFFFFF" />

            <Text style={styles.shareButtonText}>Invite Friends</Text>

            <Icon name="arrow-right" size={21} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How it works</Text>

            <Step
              number="1"
              title="Share your code"
              description="Send your referral code or invite link to a friend."
            />

            <Step
              number="2"
              title="Your friend registers"
              description="Your friend creates a TradeHub account using your code."
            />

            <Step
              number="3"
              title="First approved recharge"
              description={`Your friend completes their first approved recharge of ${formatCurrency(
                minimumRecharge,
              )} or more.`}
            />

            <Step
              number="4"
              title="Both receive the reward"
              description={`Both wallets receive ${formatCurrency(
                rewardAmount,
              )}.`}
              last
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Referral history</Text>

              <Text style={styles.historyCount}>{referrals.length}</Text>
            </View>

            {referrals.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Icon
                  name="account-multiple-outline"
                  size={36}
                  color={COLORS.textMuted}
                />

                <Text style={styles.emptyHistoryTitle}>No referrals yet</Text>

                <Text style={styles.emptyHistoryText}>
                  Share your code to invite your first friend.
                </Text>
              </View>
            ) : (
              referrals.map(referral => {
                const referee = referral.referee || {};

                const statusColor = getReferralStatusColor(referral.status);

                return (
                  <View
                    key={String(referral._id || referral.id)}
                    style={styles.referralItem}
                  >
                    <View style={styles.referralAvatar}>
                      <Text style={styles.referralAvatarText}>
                        {(referee.fullName || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.referralDetails}>
                      <Text style={styles.referralName} numberOfLines={1}>
                        {referee.fullName || 'Invited user'}
                      </Text>

                      <Text style={styles.referralDate}>
                        Joined {formatDate(referral.createdAt)}
                      </Text>
                    </View>

                    <View style={styles.referralStatusContainer}>
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: statusColor,
                          },
                        ]}
                      >
                        {getReferralStatusLabel(referral.status)}
                      </Text>

                      {referral.status === 'rewarded' && (
                        <Text style={styles.earnedText}>
                          +₹
                          {referral.rewardAmount || rewardAmount}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.noteCard}>
            <Icon name="information-outline" size={20} color={COLORS.primary} />

            <Text style={styles.noteText}>
              Rewards are credited only after your referred user completes their
              first approved recharge. Rejected or pending deposits do not
              qualify.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const Step = ({ number, title, description, last = false }) => {
  return (
    <View style={styles.stepWrapper}>
      <View style={styles.stepRow}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{number}</Text>
        </View>

        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>{title}</Text>

          <Text style={styles.stepDescription}>{description}</Text>
        </View>
      </View>

      {!last && <View style={styles.stepConnector} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  safeAreaTop: {
    backgroundColor: COLORS.background,
  },

  header: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceAlt,
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.3,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 32,
  },

  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
  },

  heroIconContainer: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: 16,
  },

  heroTitle: {
    fontSize: 27,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 10,
  },

  heroSubtitle: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },

  rewardCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },

  rewardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
    marginRight: 13,
  },

  rewardTextContainer: {
    flex: 1,
  },

  rewardLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 3,
  },

  rewardAmount: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },

  rewardDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 17,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4,
  },

  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },

  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },

  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 13,
  },

  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  codeBox: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },

  codeText: {
    flex: 1,
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginLeft: 10,
  },

  linkBox: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.blue,
  },

  linkText: {
    flex: 1,
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 10,
  },

  copyButton: {
    width: 52,
    height: 52,
    marginLeft: 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },

  linkCopyButton: {
    width: 52,
    height: 52,
    marginLeft: 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blueSoft,
    borderWidth: 1,
    borderColor: COLORS.blue,
  },

  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginHorizontal: 16,
    marginBottom: 26,
    paddingVertical: 16,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
  },

  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  stepWrapper: {
    position: 'relative',
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },

  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  stepContent: {
    flex: 1,
    padding: 13,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  stepTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },

  stepDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  stepConnector: {
    width: 2,
    height: 18,
    backgroundColor: COLORS.primary,
    marginLeft: 17,
    marginVertical: 4,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  historyCount: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 13,
  },

  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    marginBottom: 9,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  referralAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
    marginRight: 11,
  },

  referralAvatarText: {
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: '900',
  },

  referralDetails: {
    flex: 1,
  },

  referralName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },

  referralDate: {
    color: COLORS.textMuted,
    fontSize: 11,
  },

  referralStatusContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },

  earnedText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '900',
  },

  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 25,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyHistoryTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 5,
  },

  emptyHistoryText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },

  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 13,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 150, 0.3)',
  },

  noteText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
});

export default ReferralScreen;
