import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/styles';

const OTPInput = ({ length = 4, value, onChangeText, error, autoFocus = true }) => {
    const [otp, setOtp] = useState(value || '');
    const inputRefs = useRef([]);

    useEffect(() => {
        setOtp(value || '');
    }, [value]);

    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [autoFocus]);

    const handleChangeText = (text, index) => {
        const cleaned = String(text || '').replace(/\D/g, '');

        if (cleaned.length > 1) {
            const pastedOtp = cleaned.slice(0, length);
            setOtp(pastedOtp);
            onChangeText(pastedOtp);

            if (pastedOtp.length === length) {
                inputRefs.current[length - 1]?.blur();
            } else if (inputRefs.current[pastedOtp.length]) {
                inputRefs.current[pastedOtp.length].focus();
            }
            return;
        }

        const newOtp = otp.split('');
        newOtp[index] = cleaned;
        const newOtpString = newOtp.join('');

        setOtp(newOtpString);
        onChangeText(newOtpString);

        if (cleaned && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
            }

            const newOtp = otp.split('');
            newOtp[index] = '';
            const newOtpString = newOtp.join('');

            setOtp(newOtpString);
            onChangeText(newOtpString);
        }
    };

    const handleFocus = (index) => {
        inputRefs.current[index]?.setNativeProps({
            selection: { start: 0, end: 1 },
        });
    };

    return (
        <View style={otpStyles.wrapper}>
            <View style={otpStyles.container}>
                {Array(length)
                    .fill(0)
                    .map((_, index) => (
                        <View
                            key={index}
                            style={[
                                otpStyles.box,
                                otp[index] && otpStyles.box_filled,
                                error && otpStyles.box_error,
                            ]}>
                            <TextInput
                                ref={ref => (inputRefs.current[index] = ref)}
                                style={otpStyles.input}
                                value={otp[index] || ''}
                                onChangeText={text => handleChangeText(text, index)}
                                onKeyPress={e => handleKeyPress(e, index)}
                                onFocus={() => handleFocus(index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                                textContentType="oneTimeCode"
                                autoComplete="sms-otp"
                            />
                        </View>
                    ))}
            </View>

            {error && <Text style={otpStyles.error}>{error}</Text>}
        </View>
    );
};

const otpStyles = StyleSheet.create({
    wrapper: {
        marginVertical: 20,
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    box: {
        width: 50,
        height: 56,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    box_filled: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight + '10',
    },
    box_error: {
        borderColor: COLORS.error,
    },
    input: {
        ...TYPOGRAPHY.h3,
        width: '100%',
        height: '100%',
        textAlign: 'center',
        color: COLORS.text,
        fontWeight: '700',
    },
    error: {
        ...TYPOGRAPHY.caption,
        color: COLORS.error,
        marginTop: 8,
        textAlign: 'center',
    },
});

export default OTPInput;