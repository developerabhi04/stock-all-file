import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/styles';

const LoadingOverlay = ({ message = 'Loading...' }) => {
    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.message}>{message}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },

    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        minWidth: 200,
        shadowColor: COLORS.shadow,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },

    message: {
        ...TYPOGRAPHY.body1,
        marginTop: 16,
        color: COLORS.text,
        textAlign: 'center',
    },
});

export default LoadingOverlay;
