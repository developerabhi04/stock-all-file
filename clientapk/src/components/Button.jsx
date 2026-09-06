import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/styles';

const Button = ({
    title,
    onPress,
    disabled = false,
    loading = false,
    variant = 'primary',
    size = 'large',
    style,
    textStyle,
    icon,
}) => {
    const getButtonStyle = () => {
        const styles = [buttonStyles.button, buttonStyles[`button_${variant}`]];

        if (size === 'small') {
            styles.push(buttonStyles.button_small);
        } else if (size === 'medium') {
            styles.push(buttonStyles.button_medium);
        }

        if (disabled || loading) {
            styles.push(buttonStyles.button_disabled);
        }

        if (style) {
            styles.push(style);
        }

        return styles;
    };

    const getTextStyle = () => {
        const styles = [
            TYPOGRAPHY.button,
            buttonStyles.buttonText,
            buttonStyles[`buttonText_${variant}`],
        ];

        if (size === 'small') {
            styles.push(buttonStyles.buttonText_small);
        }

        if (disabled || loading) {
            styles.push(buttonStyles.buttonText_disabled);
        }

        if (textStyle) {
            styles.push(textStyle);
        }

        return styles;
    };

    return (
        <TouchableOpacity
            style={getButtonStyle()}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}>
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? COLORS.white : COLORS.primary}
                    size="small"
                />
            ) : (
                <View style={buttonStyles.content}>
                    {icon && <View style={buttonStyles.icon}>{icon}</View>}
                    <Text style={getTextStyle()}>{title}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const buttonStyles = StyleSheet.create({
    button: {
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        paddingHorizontal: 24,
        shadowColor: COLORS.shadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    button_primary: {
        backgroundColor: COLORS.primary,
    },

    button_secondary: {
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },

    button_outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: COLORS.border,
    },

    button_text: {
        backgroundColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
    },

    button_small: {
        minHeight: 40,
        paddingHorizontal: 16,
    },

    button_medium: {
        minHeight: 48,
        paddingHorizontal: 20,
    },

    button_disabled: {
        backgroundColor: COLORS.borderLight,
        shadowOpacity: 0,
        elevation: 0,
    },

    buttonText: {
        color: COLORS.white,
        textAlign: 'center',
    },

    buttonText_primary: {
        color: COLORS.white,
    },

    buttonText_secondary: {
        color: COLORS.primary,
    },

    buttonText_outline: {
        color: COLORS.text,
    },

    buttonText_text: {
        color: COLORS.primary,
    },

    buttonText_small: {
        fontSize: 14,
    },

    buttonText_disabled: {
        color: COLORS.textDisabled,
    },

    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    icon: {
        marginRight: 8,
    },
});

export default Button;
