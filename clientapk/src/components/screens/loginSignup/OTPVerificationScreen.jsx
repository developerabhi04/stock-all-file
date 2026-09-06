import React, { useState, useRef, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../../../services/ApiService';
import { AuthContext } from '../../../navigation/AppNavigatior';

const OTP_LENGTH = 4;

const COLORS = {
    background: '#000000',
    surface: '#1A1A1A',
    surfaceLight: '#222222',
    text: '#FFFFFF',
    textSecondary: '#999999',
    border: '#2A2A2A',
    primary: '#00C896',
    primaryLight: 'rgba(0, 200, 150, 0.15)',
    error: '#FF5252',
    errorLight: 'rgba(255, 82, 82, 0.15)',
};

const sanitizePhoneNumber = (value) =>
    String(value || '').replace(/\D/g, '').slice(0, 10);

const sanitizeOTP = (value) =>
    String(value || '').replace(/\D/g, '').slice(0, OTP_LENGTH);

const formatIndianPhoneNumber = (value) => {
    const cleaned = sanitizePhoneNumber(value);
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
};

const createEmptyOtp = () => Array(OTP_LENGTH).fill('');

const OTPVerificationScreen = ({ route, navigation }) => {
    const {
        phoneNumber,
        fullName,
        referralCode = '',
        isLogin,
    } = route.params || {};
    const cleanPhoneNumber = sanitizePhoneNumber(phoneNumber);
    const { signIn } = useContext(AuthContext);

    const [otp, setOtp] = useState(createEmptyOtp());
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef([]);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const spinnerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    useEffect(() => {
        setResendTimer(60);
        setCanResend(false);
    }, []);

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendTimer]);

    useEffect(() => {
        let spinLoop;

        if (loading) {
            spinnerAnim.setValue(0);
            spinLoop = Animated.loop(
                Animated.timing(spinnerAnim, {
                    toValue: 1,
                    duration: 700,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            );
            spinLoop.start();
        }

        return () => {
            if (spinLoop) {
                spinLoop.stop();
            }
        };
    }, [loading, spinnerAnim]);

    const otpString = otp.join('');
    const isOtpComplete = new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otpString);

    const handleOTPChange = (text, index) => {
        if (loading) return;

        setError('');
        const cleaned = String(text || '').replace(/\D/g, '');

        if (cleaned.length > 1) {
            const pasted = cleaned.slice(0, OTP_LENGTH).split('');
            const newOtp = createEmptyOtp();

            pasted.forEach((digit, i) => {
                newOtp[i] = digit;
            });

            setOtp(newOtp);

            const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        const value = cleaned ? cleaned.charAt(cleaned.length - 1) : '';
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (otp[index]) {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
                return;
            }

            if (index > 0) {
                inputRefs.current[index - 1]?.focus();
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
            }
        }
    };

    const verifyOTP = async () => {
        const cleanOtp = sanitizeOTP(otpString);

        if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(cleanOtp)) {
            setError(`Please enter a valid ${OTP_LENGTH}-digit OTP`);
            return;
        }

        setLoading(true);
        setError('');

        try {
            let response;

            if (isLogin) {
                response = await ApiService.verifyLoginOTP(cleanPhoneNumber, cleanOtp);
            } else {
                response = await ApiService.verifySignupOTP(
                    fullName,
                    cleanPhoneNumber,
                    cleanOtp,
                    referralCode
                );
            }

            if (response?.success) {
                await signIn(response?.data?.user || null);
            } else {
                setError(response?.message || 'Invalid OTP. Please try again.');
                setOtp(createEmptyOtp());
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            console.error('OTP Verification Error:', err);
            setError('An unexpected error occurred. Please try again.');
            setOtp(createEmptyOtp());
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend || loading) return;

        setOtp(createEmptyOtp());
        setError('');
        setLoading(true);

        try {
            let response;

            if (isLogin) {
                response = await ApiService.resendLoginOTP(cleanPhoneNumber);
            } else {
                response = await ApiService.resendSignupOTP(fullName, cleanPhoneNumber);
            }

            if (response?.success) {
                setResendTimer(60);
                setCanResend(false);
                inputRefs.current[0]?.focus();
            } else {
                setError(response?.message || 'Failed to resend OTP');
            }
        } catch (err) {
            console.error('Resend OTP Error:', err);
            setError('Failed to resend OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const spinnerRotate = spinnerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            disabled={loading}
                        >
                            <Icon name="arrow-left" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        <View style={styles.iconContainer}>
                            <View style={styles.iconCircle}>
                                <Icon name="message-text" size={40} color="#00C896" />
                            </View>
                        </View>

                        <Text style={styles.title}>Verify OTP</Text>
                        <Text style={styles.subtitle}>
                            Enter the {OTP_LENGTH}-digit code sent to
                        </Text>
                        <Text style={styles.phoneNumber}>
                            +91 {formatIndianPhoneNumber(cleanPhoneNumber)}
                        </Text>

                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => navigation.goBack()}
                            disabled={loading}
                        >
                            <Text style={styles.editButtonText}>Edit Number</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                style={[
                                    styles.otpInput,
                                    digit && styles.otpInputFilled,
                                    error && styles.otpInputError,
                                ]}
                                value={digit}
                                onChangeText={(text) => handleOTPChange(text, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                                editable={!loading}
                                textContentType="oneTimeCode"
                                autoComplete="sms-otp"
                            />
                        ))}
                    </View>

                    {error ? (
                        <View style={styles.errorContainer}>
                            <Icon name="alert-circle" size={16} color="#FF5252" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Animated.View style={{ transform: [{ rotate: spinnerRotate }] }}>
                                <Icon name="loading" size={20} color="#00C896" />
                            </Animated.View>
                            <Text style={styles.loadingText}>Verifying OTP...</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[
                            styles.verifyButton,
                            (!isOtpComplete || loading) && styles.verifyButtonDisabled,
                        ]}
                        onPress={verifyOTP}
                        disabled={!isOtpComplete || loading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.verifyButtonText}>Verify OTP</Text>
                    </TouchableOpacity>

                    <View style={styles.resendContainer}>
                        {canResend ? (
                            <TouchableOpacity onPress={handleResend} disabled={loading}>
                                <Text style={styles.resendText}>Resend OTP</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.timerText}>
                                Resend OTP in {resendTimer}s
                            </Text>
                        )}
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    keyboardView: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
    header: { alignItems: 'center', marginBottom: 40 },
    backButton: {
        alignSelf: 'flex-start',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    iconContainer: { marginBottom: 20 },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    phoneNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 12,
    },
    editButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
    },
    editButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.primary,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
    },
    otpInput: {
        flex: 1,
        height: 60,
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
    },
    otpInputFilled: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight,
    },
    otpInputError: {
        borderColor: COLORS.error,
        backgroundColor: COLORS.errorLight,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.errorLight,
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
        gap: 8,
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.error,
        fontWeight: '600',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        gap: 10,
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    verifyButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    verifyButtonDisabled: { opacity: 0.5 },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    resendContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    resendText: {
        fontSize: 15,
        color: COLORS.primary,
        fontWeight: '700',
    },
    timerText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
});

export default OTPVerificationScreen;