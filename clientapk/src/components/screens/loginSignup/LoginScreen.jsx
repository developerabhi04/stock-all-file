import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    StatusBar,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Easing,
} from 'react-native';
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
    primaryLight: 'rgba(0, 200, 150, 0.15)',
    error: '#FF5252',
    errorLight: 'rgba(255, 82, 82, 0.15)',
};

const sanitizePhoneNumber = (value) =>
    String(value || '').replace(/\D/g, '').slice(0, 10);

const formatIndianPhoneNumber = (value) => {
    const cleaned = sanitizePhoneNumber(value);
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
};

const isValidIndianPhoneNumber = (value) => /^[6-9]\d{9}$/.test(value);

const LoginScreen = ({ navigation }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
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

    React.useEffect(() => {
        let animation;

        if (loading) {
            spinAnim.setValue(0);
            animation = Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            );
            animation.start();
        } else {
            spinAnim.stopAnimation();
        }

        return () => {
            if (animation) {
                animation.stop();
            }
        };
    }, [loading, spinAnim]);

    const handlePhoneChange = (text) => {
        setError('');
        setPhoneNumber(sanitizePhoneNumber(text));
    };

    const handleContinue = async () => {
        const cleanPhone = sanitizePhoneNumber(phoneNumber);

        if (!isValidIndianPhoneNumber(cleanPhone)) {
            setError('Please enter a valid 10-digit Indian phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await ApiService.sendLoginOTP(cleanPhone);

            if (response.success) {
                navigation.navigate('OTPVerification', {
                    phoneNumber: cleanPhone,
                    isLogin: true,
                });
            } else {
                setError(response.message || 'Failed to send OTP');
            }
        } catch (err) {
            console.error('Login Error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const isPhoneValid = isValidIndianPhoneNumber(phoneNumber);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                            <Icon name="chart-line" size={30} color="#00C896" />
                        </View>
                        <Text style={styles.appName}>TradeHub</Text>
                        <Text style={styles.tagline}>Smart Trading, Simplified</Text>
                    </View>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.content,
                        { opacity: fadeAnim },
                    ]}
                >
                    <View style={styles.welcomeSection}>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>
                            Enter your phone number to continue
                        </Text>
                    </View>

                    <View style={styles.inputSection}>
                        <View
                            style={[
                                styles.inputContainer,
                                error && styles.inputContainerError,
                                isPhoneValid && styles.inputContainerSuccess,
                            ]}
                        >
                            <View style={styles.inputPrefix}>
                                <Icon name="phone" size={20} color="#00C896" />
                                <Text style={styles.countryCode}>+91</Text>
                            </View>

                            <TextInput
                                style={styles.input}
                                value={formatIndianPhoneNumber(phoneNumber)}
                                onChangeText={handlePhoneChange}
                                placeholder="98765 43210"
                                placeholderTextColor="#666666"
                                keyboardType="phone-pad"
                                maxLength={11}
                                editable={!loading}
                            />

                            {isPhoneValid && !loading && (
                                <Icon name="check-circle" size={20} color="#00C896" />
                            )}
                        </View>

                        {error ? (
                            <View style={styles.errorContainer}>
                                <Icon name="alert-circle" size={14} color="#FF5252" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <View style={styles.infoBox}>
                            <Icon name="information-outline" size={16} color="#00C896" />
                            <Text style={styles.infoText}>
                                We'll send you a 6-digit OTP for verification
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            (!isPhoneValid || loading) && styles.continueButtonDisabled,
                        ]}
                        onPress={handleContinue}
                        disabled={!isPhoneValid || loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                    <Icon name="loading" size={20} color="#FFFFFF" />
                                </Animated.View>
                                <Text style={styles.continueButtonText}>Sending OTP...</Text>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.continueButtonText}>Continue</Text>
                                <Icon name="arrow-right" size={20} color="#FFFFFF" />
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.footer,
                        { opacity: fadeAnim },
                    ]}
                >
                    <Text style={styles.footerText}>Don't have an account?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                        <Text style={styles.footerLink}>Sign Up</Text>
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>
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

    header: {
        paddingTop: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
    },

    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },

    logoCircle: {
        width: 70,
        height: 70,
        borderRadius: 50,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },

    appName: {
        fontSize: 28,
        fontWeight: '900',
        color: COLORS.text,
        letterSpacing: -1,
        marginBottom: 8,
    },

    tagline: {
        fontSize: 10,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },

    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
    },

    welcomeSection: {
        marginBottom: 40,
    },

    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 8,
    },

    subtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },

    inputSection: {
        marginBottom: 24,
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
        marginRight: 12,
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
        fontSize: 18,
        fontWeight: '700',
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

    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
        padding: 12,
        borderRadius: 10,
        marginTop: 16,
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

    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 24,
        gap: 6,
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

export default LoginScreen;