import { useFocusEffect } from '@react-navigation/native';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../../../../navigation/AppNavigatior';
import ApiService from '../../../../services/ApiService';
import AuthStorage from '../../../../services/AuthStorage';

const COLORS = {
  bg: '#000000',
  surface: '#1A1A1A',
  surfaceAlt: '#141414',
  border: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#999999',
  textMuted: '#666666',
  primary: '#00C896',
  primarySoft: 'rgba(0, 200, 150, 0.15)',
  warning: '#FF9800',
  warningSoft: 'rgba(255, 152, 0, 0.15)',
  danger: '#FF5252',
  dangerSoft: 'rgba(255, 82, 82, 0.12)',
  skeletonBase: '#1F1F1F',
  skeletonHighlight: '#2B2B2B',
};

export default function ProfileScreen({ navigation }) {
  const { user, signOut, refreshAuthUser } = useContext(AuthContext);

  const [userData, setUserData] = useState(user || null);
  const [loading, setLoading] = useState(!user);
  const [refreshing, setRefreshing] = useState(false);

  const pulseAnim = useRef(new Animated.Value(0.45)).current;
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      setUserData(user);
      setLoading(false);
    }
  }, [user]);

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
      ]),
    );

    if (loading) {
      loop.start();
    }

    return () => {
      loop.stop();
    };
  }, [loading, pulseAnim]);

  const fetchUserProfile = useCallback(
    async (options = {}) => {
      const {
        showLoader = false,
        isPullToRefresh = false,
        preferCache = false,
      } = options;

      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;

      try {
        if (showLoader && isMountedRef.current) {
          setLoading(true);
        }

        if (isPullToRefresh && isMountedRef.current) {
          setRefreshing(true);
        }

        if (preferCache) {
          const cachedUser = await AuthStorage.getUser();
          if (cachedUser && isMountedRef.current) {
            setUserData(cachedUser);
            setLoading(false);
          }
        }

        let response = null;

        if (typeof refreshAuthUser === 'function' && !preferCache) {
          const freshUser = await refreshAuthUser();
          if (freshUser && isMountedRef.current) {
            setUserData(freshUser);
            return;
          }
        } else {
          response = await ApiService.getUserProfile({
            preferCache,
            backgroundRefresh: false,
          });

          if (response?.success && response?.data) {
            if (isMountedRef.current) {
              setUserData(response.data);
            }
            return;
          }

          if (response?.statusCode === 401) {
            await signOut();
            return;
          }
        }

        const cachedUser = await AuthStorage.getUser();
        if (cachedUser && isMountedRef.current) {
          setUserData(cachedUser);
        }
      } catch (error) {
        console.error('❌ Error fetching profile:', error);

        const cachedUser = await AuthStorage.getUser();
        if (cachedUser && isMountedRef.current) {
          setUserData(cachedUser);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
        isFetchingRef.current = false;
      }
    },
    [refreshAuthUser, signOut],
  );

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile({
        showLoader: !userData,
        preferCache: !userData,
      });
    }, [fetchUserProfile, userData]),
  );

  const onRefresh = useCallback(() => {
    fetchUserProfile({
      isPullToRefresh: true,
      preferCache: false,
    });
  }, [fetchUserProfile]);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('🚪 Logging out...');
            await ApiService.logout();
            await signOut();
            console.log('✅ Logged out successfully');
          } catch (error) {
            console.error('❌ Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  }, [signOut]);

  const handleNavigation = useCallback(
    item => {
      if (typeof item.route === 'function') {
        item.route();
        return;
      }

      try {
        navigation.navigate(item.route);
      } catch (error) {
        console.log(`Screen ${item.route} not implemented yet`);
      }
    },
    [navigation],
  );

  const settings = useMemo(
    () => [
      {
        icon: 'account-outline',
        label: 'Profile',
        route: 'EditProfile',
      },
      {
        icon: 'gift-outline',
        label: 'Refer & Earn',
        route: 'ReferInvite',
      },
      {
        icon: 'help-circle-outline',
        label: 'Help & Support',
        route: 'HelpSupport',
      },
      {
        icon: 'logout',
        label: 'Logout',
        route: handleLogout,
      },
    ],
    [handleLogout],
  );

  const walletBalance = Number(userData?.walletBalance || 0);

  const skeletonAnimatedStyle = useMemo(() => {
    const opacity = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.45, 1],
    });

    return { opacity };
  }, [pulseAnim]);

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

  const ProfileSkeleton = () => (
    <>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <SkeletonBlock width={100} height={100} radius={50} />
          <SkeletonBlock
            width={32}
            height={32}
            radius={16}
            style={styles.skeletonEditAvatar}
          />
        </View>

        <SkeletonBlock
          width={150}
          height={22}
          radius={8}
          style={{ marginBottom: 8 }}
        />
        <SkeletonBlock width={110} height={14} radius={7} />
      </View>

      <View style={styles.walletSection}>
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <SkeletonBlock
              width={38}
              height={38}
              radius={19}
              style={{ marginRight: 14 }}
            />

            <View style={{ flex: 1 }}>
              <SkeletonBlock width={90} height={10} radius={6} />
              <SkeletonBlock
                width={140}
                height={20}
                radius={8}
                style={{ marginTop: 8 }}
              />
            </View>

            <SkeletonBlock width={20} height={20} radius={10} />
          </View>

          <View style={styles.walletActions}>
            <SkeletonBlock width="48%" height={44} radius={10} />
            <SkeletonBlock width="48%" height={44} radius={10} />
          </View>
        </View>
      </View>

      <View style={styles.settingsList}>
        <SkeletonBlock
          width={64}
          height={10}
          radius={5}
          style={{ marginBottom: 12 }}
        />

        {[1, 2, 3].map((item, index) => (
          <View
            key={`setting-skeleton-${item}`}
            style={[
              styles.settingItem,
              index === 2 && {
                backgroundColor: COLORS.dangerSoft,
                borderColor: 'rgba(255, 82, 82, 0.22)',
              },
            ]}
          >
            <SkeletonBlock
              width={36}
              height={36}
              radius={18}
              style={{ marginRight: 12 }}
            />
            <SkeletonBlock width="52%" height={13} radius={6} />
            <SkeletonBlock
              width={18}
              height={18}
              radius={9}
              style={{ marginLeft: 'auto' }}
            />
          </View>
        ))}
      </View>

      <View style={styles.appInfoSection}>
        <SkeletonBlock width={88} height={18} radius={7} />
        <SkeletonBlock
          width={72}
          height={12}
          radius={6}
          style={{ marginTop: 10 }}
        />
        <SkeletonBlock
          width={180}
          height={11}
          radius={6}
          style={{ marginTop: 10 }}
        />
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Profile</Text>

          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {loading ? (
          <ProfileSkeleton />
        ) : (
          <>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Icon name="account" size={56} color={COLORS.text} />
                </View>

                <TouchableOpacity
                  style={styles.editAvatarButton}
                  activeOpacity={0.8}
                  onPress={() =>
                    Alert.alert(
                      'Coming Soon',
                      'Profile picture upload will be available soon.',
                    )
                  }
                >
                  <Icon name="camera" size={15} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.userName}>
                {userData?.fullName || 'User'}
              </Text>

              <Text style={styles.userPhone}>
                {userData?.phoneNumber ? `+91 ${userData.phoneNumber}` : ''}
              </Text>
            </View>

            <View style={styles.walletSection}>
              <TouchableOpacity
                style={styles.walletCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ProfileWallet')}
              >
                <View style={styles.walletHeader}>
                  <View style={styles.walletIconContainer}>
                    <Icon
                      name="wallet-outline"
                      size={22}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={styles.walletInfo}>
                    <Text style={styles.walletLabel}>Wallet Balance</Text>
                    <Text style={styles.walletBalance}>
                      ₹
                      {walletBalance.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </View>

                  <Icon
                    name="chevron-right"
                    size={22}
                    color={COLORS.textMuted}
                  />
                </View>

                <View style={styles.walletActions}>
                  <TouchableOpacity
                    style={styles.addMoneyButton}
                    activeOpacity={0.85}
                    onPress={e => {
                      e.stopPropagation();
                      navigation.navigate('Payment');
                    }}
                  >
                    <Icon name="plus-circle" size={15} color={COLORS.primary} />
                    <Text style={styles.addMoneyText}>Add Money</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.withdrawButton}
                    activeOpacity={0.85}
                    onPress={e => {
                      e.stopPropagation();
                      navigation.navigate('Withdraw');
                    }}
                  >
                    <Icon
                      name="bank-transfer-out"
                      size={15}
                      color={COLORS.warning}
                    />
                    <Text style={styles.withdrawText}>Withdraw</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsList}>
              <Text style={styles.sectionTitle}>Settings</Text>

              {settings.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.settingItem,
                    item.label === 'Logout' && styles.logoutItem,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => handleNavigation(item)}
                >
                  <View
                    style={[
                      styles.settingIconContainer,
                      item.label === 'Logout' && styles.logoutIconContainer,
                    ]}
                  >
                    <Icon
                      name={item.icon}
                      size={20}
                      color={
                        item.label === 'Logout' ? COLORS.danger : COLORS.primary
                      }
                    />
                  </View>

                  <Text
                    style={[
                      styles.settingLabel,
                      item.label === 'Logout' && styles.logoutLabel,
                    ]}
                  >
                    {item.label}
                  </Text>

                  <Icon
                    name="chevron-right"
                    size={18}
                    color={
                      item.label === 'Logout' ? COLORS.danger : COLORS.textMuted
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.appInfoSection}>
              <Text style={styles.appName}>TradeHub</Text>
              <Text style={styles.versionText}>Version 1.0.0</Text>
              <Text style={styles.copyrightText}>
                © 2026 TradeHub. All rights reserved.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  safeArea: {
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
    backgroundColor: COLORS.surfaceAlt,
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

  profileSection: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: '#141414',
  },

  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.primary,
  },

  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.bg,
  },

  skeletonEditAvatar: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.skeletonHighlight,
    borderWidth: 3,
    borderColor: COLORS.bg,
  },

  userName: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: 0.2,
  },

  userPhone: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  walletSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: '#141414',
  },

  walletCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  walletIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  walletInfo: {
    flex: 1,
  },

  walletLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  walletBalance: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },

  walletActions: {
    flexDirection: 'row',
    gap: 12,
  },

  addMoneyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },

  addMoneyText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.2,
  },

  withdrawButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warningSoft,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },

  withdrawText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.warning,
    letterSpacing: 0.2,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  settingsList: {
    paddingHorizontal: 16,
    paddingTop: 20,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  logoutItem: {
    backgroundColor: COLORS.dangerSoft,
    borderColor: 'rgba(255, 82, 82, 0.28)',
  },

  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  logoutIconContainer: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
  },

  settingLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.1,
  },

  logoutLabel: {
    color: COLORS.danger,
  },

  appInfoSection: {
    paddingHorizontal: 16,
    paddingVertical: 28,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#141414',
  },

  appName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: 0.3,
  },

  versionText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: 4,
  },

  copyrightText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
  },
});
