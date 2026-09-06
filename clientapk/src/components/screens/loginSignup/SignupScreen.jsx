import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  findNodeHandle,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../../../services/ApiService';

const COLORS = {
  background: '#000000',
  surface: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#999999',
  border: '#2A2A2A',
  primary: '#00C896',
  refer: '#FF5252',
  primaryLight: 'rgba(0, 200, 150, 0.15)',
  error: '#FF5252',
  errorLight: 'rgba(255, 82, 82, 0.15)',
};

const sanitizePhoneNumber = value =>
  String(value || '')
    .replace(/\D/g, '')
    .slice(0, 10);

const formatIndianPhoneNumber = value => {
  const cleaned = sanitizePhoneNumber(value);
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
};

const isValidIndianPhoneNumber = value => /^[6-9]\d{9}$/.test(value);

const sanitizeReferralCode = value =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);

const SignupScreen = ({ navigation, route }) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [referralCode, setReferralCode] = useState(
    route?.params?.referralCode
      ? sanitizeReferralCode(route.params.referralCode)
      : '',
  );
  const [showReferralInput, setShowReferralInput] = useState(
    !!route?.params?.referralCode,
  );
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const scrollRef = useRef(null);
  const nameInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const referralInputRef = useRef(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleFullNameChange = text => {
    setErrors(prev => ({ ...prev, fullName: '', general: '' }));
    setFullName(text);
  };

  const handlePhoneChange = text => {
    setErrors(prev => ({ ...prev, phoneNumber: '', general: '' }));
    const cleaned = sanitizePhoneNumber(text);
    setPhoneNumber(cleaned);
  };

  const handleReferralChange = text => {
    setErrors(prev => ({ ...prev, referralCode: '', general: '' }));
    setReferralCode(sanitizeReferralCode(text));
  };

  // Auto-scroll helper — brings focused input above the keyboard
  const scrollToInput = reactNode => {
    if (scrollRef.current && reactNode) {
      scrollRef.current.scrollToFocusedInput(reactNode);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const cleanPhone = sanitizePhoneNumber(phoneNumber);

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    if (!cleanPhone) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!isValidIndianPhoneNumber(cleanPhone)) {
      newErrors.phoneNumber =
        'Please enter a valid 10-digit Indian phone number';
    }

    if (referralCode && referralCode.length < 4) {
      newErrors.referralCode = 'Referral code looks too short';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (loading) return;
    if (!validateForm()) return;

    const cleanPhone = sanitizePhoneNumber(phoneNumber);
    const cleanName = fullName.trim();
    const cleanReferral = referralCode ? referralCode.trim() : '';

    setLoading(true);
    setErrors({});

    try {
      const response = await ApiService.sendSignupOTP(cleanName, cleanPhone);

      if (response.success) {
        navigation.navigate('OTPVerification', {
          phoneNumber: cleanPhone,
          fullName: cleanName,
          referralCode: cleanReferral,
          isLogin: false,
        });
      } else {
        setErrors({
          general: response.message || 'Failed to send OTP',
        });

        if (response.message?.includes('already registered')) {
          Alert.alert(
            'Phone Already Registered',
            'This phone number is already registered. Would you like to login instead?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Login',
                onPress: () => navigation.navigate('Login'),
              },
            ],
          );
        }
      }
    } catch (err) {
      console.error('Signup Error:', err);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    fullName.trim().length >= 3 && isValidIndianPhoneNumber(phoneNumber);

  const phoneDisplayValue = phoneFocused
    ? phoneNumber
    : formatIndianPhoneNumber(phoneNumber);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <KeyboardAwareScrollView
        ref={scrollRef}
        style={styles.keyboardView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 80}
        extraHeight={120}
        keyboardOpeningTime={0}
      >
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Icon name="chart-line" size={28} color="#00C896" />
            </View>
            <Text style={styles.appName}>TradeHub</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.welcomeSection}>
            <Text style={styles.title}>Create Account</Text>
          </View>

          {errors.general ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={14} color="#FF5252" />
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          ) : null}

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View
              style={[
                styles.inputContainer,
                errors.fullName && styles.inputContainerError,
                fullName.trim().length >= 3 && styles.inputContainerSuccess,
              ]}
            >
              <Icon name="account" size={20} color="#00C896" />
              <TextInput
                ref={nameInputRef}
                style={styles.input}
                value={fullName}
                onChangeText={handleFullNameChange}
                placeholder="Enter your full name"
                placeholderTextColor="#666666"
                autoCapitalize="words"
                editable={!loading}
                returnKeyType="next"
                onSubmitEditing={() => phoneInputRef.current?.focus()}
                blurOnSubmit={false}
              />
              {fullName.trim().length >= 3 && (
                <Icon name="check-circle" size={20} color="#00C896" />
              )}
            </View>

            {errors.fullName ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={14} color="#FF5252" />
                <Text style={styles.errorText}>{errors.fullName}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View
              style={[
                styles.inputContainer,
                errors.phoneNumber && styles.inputContainerError,
                isValidIndianPhoneNumber(phoneNumber) &&
                  styles.inputContainerSuccess,
              ]}
            >
              <View style={styles.inputPrefix}>
                <Icon name="phone" size={20} color="#00C896" />
                <Text style={styles.countryCode}>+91</Text>
              </View>

              <TextInput
                ref={phoneInputRef}
                style={styles.input}
                value={phoneDisplayValue}
                onChangeText={handlePhoneChange}
                onFocus={event => {
                  setPhoneFocused(true);
                  scrollToInput(findNodeHandle(event.target));
                }}
                onBlur={() => setPhoneFocused(false)}
                placeholder={phoneFocused ? '' : '98765 43210'}
                placeholderTextColor="#666666"
                keyboardType={
                  Platform.OS === 'ios' ? 'number-pad' : 'phone-pad'
                }
                maxLength={11}
                editable={!loading}
                returnKeyType="done"
                selectionColor={COLORS.primary}
                onSubmitEditing={() => phoneInputRef.current?.blur()}
              />

              {isValidIndianPhoneNumber(phoneNumber) && (
                <Icon name="check-circle" size={20} color="#00C896" />
              )}
            </View>

            {errors.phoneNumber ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={14} color="#FF5252" />
                <Text style={styles.errorText}>{errors.phoneNumber}</Text>
              </View>
            ) : null}
          </View>

          {/* Referral code section */}
          <View style={styles.inputSection}>
            {!showReferralInput ? (
              <TouchableOpacity
                style={styles.referralToggle}
                onPress={() => setShowReferralInput(true)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Icon name="gift-outline" size={18} color={COLORS.refer} />
                <Text style={styles.referralToggleText}>
                  Have a referral code?
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.inputLabel}>Referral Code (optional)</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.referralCode && styles.inputContainerError,
                    referralCode.length >= 4 && styles.inputContainerSuccess,
                  ]}
                >
                  <Icon name="gift-outline" size={20} color="#00C896" />
                  <TextInput
                    ref={referralInputRef}
                    style={styles.input}
                    value={referralCode}
                    onChangeText={handleReferralChange}
                    placeholder="e.g. TH1A2B3C"
                    placeholderTextColor="#666666"
                    autoCapitalize="characters"
                    editable={!loading}
                    returnKeyType="done"
                    maxLength={12}
                  />
                  {referralCode.length >= 4 && (
                    <Icon name="check-circle" size={20} color="#00C896" />
                  )}
                </View>

                {errors.referralCode ? (
                  <View style={styles.errorContainer}>
                    <Icon name="alert-circle" size={14} color="#FF5252" />
                    <Text style={styles.errorText}>{errors.referralCode}</Text>
                  </View>
                ) : (
                  <Text style={styles.referralHint}>
                    Your friend gets ₹1000 and you get ₹1000 after your first
                    recharge of ₹5,000+
                  </Text>
                )}
              </>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.continueButton,
              (!isFormValid || loading) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!isFormValid || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.continueButtonText}>Sending OTP...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.continueButtonText}>Continue</Text>
                <Icon name="arrow-right" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Icon name="shield-check" size={16} color="#00C896" />
            <Text style={styles.infoText}>
              Your data is secure and encrypted
            </Text>
          </View>
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Login</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  welcomeSection: {
    marginBottom: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  inputContainerError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
  },
  inputContainerSuccess: {
    borderColor: COLORS.primary,
  },
  inputPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    gap: 8,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    padding: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '600',
  },
  referralToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  referralToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.refer,
  },
  referralHint: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  termsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default SignupScreen;
