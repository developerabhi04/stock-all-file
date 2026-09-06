import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/styles';

const Input = ({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    keyboardType = 'default',
    maxLength,
    editable = true,
    secureTextEntry = false,
    leftIcon,
    rightIcon,
    onRightIconPress,
    autoFocus = false,
    multiline = false,
    numberOfLines = 1,
    style,
    inputStyle,
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const getContainerStyle = () => {
        const styles = [inputStyles.container];

        if (isFocused) {
            styles.push(inputStyles.container_focused);
        }

        if (error) {
            styles.push(inputStyles.container_error);
        }

        if (!editable) {
            styles.push(inputStyles.container_disabled);
        }

        if (style) {
            styles.push(style);
        }

        return styles;
    };

    return (
        <View style={inputStyles.wrapper}>
            {label && <Text style={inputStyles.label}>{label}</Text>}

            <View style={getContainerStyle()}>
                {leftIcon && <View style={inputStyles.leftIcon}>{leftIcon}</View>}

                <TextInput
                    style={[
                        inputStyles.input,
                        multiline && inputStyles.input_multiline,
                        inputStyle,
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textLight}
                    keyboardType={keyboardType}
                    maxLength={maxLength}
                    editable={editable}
                    secureTextEntry={secureTextEntry}
                    autoFocus={autoFocus}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />

                {rightIcon && (
                    <TouchableOpacity
                        style={inputStyles.rightIcon}
                        onPress={onRightIconPress}
                        disabled={!onRightIconPress}>
                        {rightIcon}
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text style={inputStyles.error}>{error}</Text>}
        </View>
    );
};

const inputStyles = StyleSheet.create({
    wrapper: {
        marginBottom: 20,
    },

    label: {
        ...TYPOGRAPHY.body2,
        color: COLORS.text,
        fontWeight: '600',
        marginBottom: 8,
    },

    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        minHeight: 56,
    },

    container_focused: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.surface,
    },

    container_error: {
        borderColor: COLORS.error,
    },

    container_disabled: {
        backgroundColor: COLORS.borderLight,
    },

    input: {
        ...TYPOGRAPHY.body1,
        flex: 1,
        color: COLORS.text,
        paddingVertical: 12,
    },

    input_multiline: {
        minHeight: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
    },

    leftIcon: {
        marginRight: 12,
    },

    rightIcon: {
        marginLeft: 12,
        padding: 4,
    },

    error: {
        ...TYPOGRAPHY.caption,
        color: COLORS.error,
        marginTop: 6,
    },
});

export default Input;
