import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const StockCard = ({ stock, onPress, theme }) => {
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [stock?.logoUrl]);

    const positiveBg =
        theme.bg === '#000000' ? '#0D2B24' : '#E8F5F1';

    const negativeBg =
        theme.bg === '#000000' ? '#2A1F0D' : '#FFF4E6';

    const iconBg = stock.isPositive ? positiveBg : negativeBg;
    const accent = stock.isPositive ? '#00C896' : '#FF9800';

    return (
        <TouchableOpacity
            style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={onPress}
            activeOpacity={0.8}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                    {stock?.logoUrl && !imageError ? (
                        <Image
                            source={{ uri: stock.logoUrl }}
                            style={styles.logo}
                            resizeMode="contain"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <Icon name="chart-line" size={16} color={accent} />
                    )}
                </View>

                <View style={[styles.changeBadge, { backgroundColor: iconBg }]}>
                    <Icon
                        name={stock.isPositive ? 'arrow-up' : 'arrow-down'}
                        size={9}
                        color={accent}
                    />
                    <Text style={[styles.change, { color: accent }]}>
                        {stock.change}
                    </Text>
                </View>
            </View>

            <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                    {stock.name}
                </Text>
                <Text style={[styles.ticker, { color: theme.textSecondary }]}>
                    {stock.ticker || stock.symbol || 'INDEX'}
                </Text>
            </View>

            <Text style={[styles.price, { color: theme.text }]}>
                ₹{stock.price}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        minHeight: 120,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    iconContainer: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    logo: {
        width: 20,
        height: 20,
        borderRadius: 4,
    },
    changeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 5,
        gap: 3,
        maxWidth: '58%',
    },
    change: {
        fontSize: 10,
        fontWeight: '700',
    },
    info: {
        marginBottom: 8,
    },
    name: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 3,
    },
    ticker: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    price: {
        fontSize: 16,
        fontWeight: '800',
    },
});

export default StockCard;